const { findRequestById, updateRequest, updateQuota, findByEmployeeAndTimeoff } = require("../repository/timeoff.repository");
const { STATUS } = require("../../../shared/constants/timeoff.constants");
const { calculateDaysByPeriod } = require("./timeoff-helper.service");

const rejectService = async (id, userEmail, body) => {
    const { reason } = body;

    const { data } = await findRequestById(parseInt(id));

    if (!data) throw new Error("Data tidak ditemukan");

    if (data.status !== STATUS.SUBMITTED) {
        throw new Error("Status tidak valid");
    }

    const approver = data.approval_logs.find(a => a.email === userEmail);

    if (!approver) {
        throw new Error("Anda tidak memiliki akses untuk reject");
    }

    if (approver.status !== STATUS.PENDING) {
        throw new Error("Anda sudah memproses request ini");
    }

    const currentApprover = data.approval_logs.find(a => a.status === STATUS.PENDING);

    if (!currentApprover || approver.email !== currentApprover.email) {
        throw new Error("Bukan giliran Anda untuk melakukan reject");
    }

    const updatedLogs = data.approval_logs.map(a => {
        if (a.email === userEmail) {
            return {
                ...a,
                status: STATUS.REJECTED,
                comment: reason,
                approved_at: new Date().toISOString()
            };
        }
        return a;
    });

    // Rollback quota
    const rejectPeriods = await calculateDaysByPeriod(data.start_date, data.end_date);
    for (const period of rejectPeriods) {
        const periodDate = `${period.year}-01-01`;
        const { data: quota } = await findByEmployeeAndTimeoff(data.employee_id, data.timeoff_id, periodDate);

        if (quota) {
            await updateQuota(quota.id, {
                remaining_balance: quota.remaining_balance + period.days,
                used_quota: Math.max(0, quota.used_quota - period.days)
            });
        }
    }

    return await updateRequest(id, {
        status: STATUS.REJECTED,
        approval_logs: updatedLogs,
        updated_by_email: userEmail
    });
};

module.exports = {
    rejectService
};
