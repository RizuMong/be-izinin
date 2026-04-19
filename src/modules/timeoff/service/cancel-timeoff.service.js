const { findRequestById, updateRequest, findByEmployeeAndTimeoff, updateQuota } = require("../repository/timeoff.repository");
const { STATUS } = require("../../../shared/constants/timeoff.constants");
const { calculateDaysByPeriod } = require("./timeoff-helper.service");

const cancelService = async (id, userEmail) => {
    const { data } = await findRequestById(parseInt(id));

    if (!data) throw new Error("Data tidak ditemukan");

    if (data.created_by_email !== userEmail) {
        throw new Error("Anda tidak memiliki akses untuk membatalkan request ini");
    }

    const rejectedStatuses = [STATUS.APPROVED, STATUS.REJECTED, STATUS.CANCELLED];

    if (rejectedStatuses.includes(data.status)) {
        throw new Error("Request yang sudah diproses tidak dapat dibatalkan");
    }

    const { data: updated } = await updateRequest(id, {
        status: STATUS.CANCELLED,
        updated_by_email: userEmail
    });

    // Rollback quota
    const periods = await calculateDaysByPeriod(data.start_date, data.end_date);
    for (const period of periods) {
        const periodDate = `${period.year}-01-01`;
        const { data: quota } = await findByEmployeeAndTimeoff(data.employee_id, data.timeoff_id, periodDate);

        if (quota) {
            await updateQuota(quota.id, {
                remaining_balance: quota.remaining_balance + period.days,
                used_quota: Math.max(0, quota.used_quota - period.days)
            });
        }
    }

    return updated;
};

module.exports = {
    cancelService
};
