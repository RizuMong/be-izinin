const { findRequestById, updateRequest } = require("../repository/timeoff.repository");
const { STATUS } = require("../../../shared/constants/timeoff.constants");
const { sendApprovalEmail } = require("../../../shared/utils/email/notification.service");

const approveService = async (id, userEmail, body) => {
    const { reason } = body;

    const { data } = await findRequestById(parseInt(id));

    if (!data) throw new Error("Data not found");

    if (data.status !== STATUS.SUBMITTED) {
        throw new Error("Invalid status");
    }

    const approver = data.approval_logs.find(a => a.email === userEmail);

    if (!approver) {
        throw new Error("You do not have access to approve");
    }

    if (approver.status !== STATUS.PENDING) {
        throw new Error("Anda sudah memproses request ini");
    }

    const currentApprover = data.approval_logs.find(a => a.status === STATUS.PENDING);

    if (!currentApprover || approver.email !== currentApprover.email) {
        throw new Error("Bukan giliran Anda untuk approve");
    }

    const updatedLogs = data.approval_logs.map(a => {
        if (a.email === userEmail) {
            return {
                ...a,
                status: STATUS.APPROVED,
                comment: reason,
                approved_at: new Date().toISOString()
            };
        }
        return a;
    });

    const nextApprover = updatedLogs.find(
        a => a.status === STATUS.PENDING
    );

    if (nextApprover) {
        sendApprovalEmail(
            nextApprover.email,
            nextApprover.approver_name
        ).catch(err => {
            console.error("Failed to send approval email:", err.message);
        });
    }

    const allApproved = updatedLogs.every(a => a.status === STATUS.APPROVED);

    return await updateRequest(id, {
        status: allApproved ? STATUS.APPROVED : STATUS.SUBMITTED,
        approval_logs: updatedLogs,
        updated_by_email: userEmail
    });
};

module.exports = {
    approveService
};
