const {
    findRequestById,
    createRequest,
    updateRequest,
    findOverlap,
    findQuotas,
    findByEmployeeAndTimeoff,
    updateQuota
} = require("../repository/timeoff.repository");

const employeeRepository = require("../../master/employee/repository/employee.repository");
const timeoffTypeRepository = require("../../master/timeoff-type/repository/time-off.repository");

const { calculateDaysByPeriod } = require("./timeoff-helper.service");
const { STATUS } = require("../../../shared/constants/timeoff.constants");
const { TIMEOFF_APPROVERS } = require("../repository/timeoff-approver.config");
const { sendApprovalEmail } = require("../../../shared/utils/email/notification.service");

const validateFK = async (repo, id, label) => {
    const { data } = await repo.findById(id);
    if (!data) {
        const err = new Error(`${label} not found`);
        err.status = 404;
        throw err;
    }
};

const validateDateConflict = async (employee_id, start_date, end_date) => {
    const { data: overlap } = await findOverlap(employee_id, start_date, end_date);
    if (overlap && overlap.length > 0) {
        const err = new Error(`A request already exists for ${overlap[0].start_date} - ${overlap[0].end_date}. Please choose different dates.`);
        err.code = "TIMEOFF_DATE_CONFLICT";
        err.conflictData = {
            conflict_start_date: overlap[0].start_date,
            conflict_end_date: overlap[0].end_date
        };
        throw err;
    }
};

const createDraftService = async (body, userEmail) => {
    const {
        employee_id,
        timeoff_id,
        start_date,
        end_date,
        reason
    } = body;

    if (!employee_id || !timeoff_id || !start_date || !end_date) {
        throw new Error("Incomplete data");
    }

    if (new Date(start_date) > new Date(end_date)) {
        throw new Error("Invalid date range");
    }

    await validateDateConflict(employee_id, start_date, end_date);

    // FK validation
    await validateFK(employeeRepository, employee_id, "Employee");
    await validateFK(timeoffTypeRepository, timeoff_id, "Time Off");

    // Hitung hari per periode (tahun)
    const periods = await calculateDaysByPeriod(start_date, end_date);
    const total_days = periods.reduce((sum, p) => sum + p.days, 0);

    if (total_days <= 0) {
        throw new Error("Tidak ada hari cuti valid");
    }

    // Validasi & siapkan quota untuk setiap periode
    const quotaSnapshots = [];
    for (const period of periods) {
        const periodDate = `${period.year}-01-01`;
        const { data: quota } = await findByEmployeeAndTimeoff(employee_id, timeoff_id, periodDate);

        if (!quota) {
            throw new Error(`Kuota cuti untuk periode ${period.year} tidak ditemukan`);
        }
        if (quota.remaining_balance < period.days) {
            throw new Error(`Kuota tidak mencukupi untuk periode ${period.year}`);
        }

        quotaSnapshots.push({
            quota,
            days: period.days,
            originalRemaining: quota.remaining_balance,
            originalUsed: quota.used_quota
        });
    }

    // build approval logs dari config
    const approval_logs = TIMEOFF_APPROVERS.map(a => ({
        employee_id: a.employee_id,
        approver_name: a.approver_name,
        email: a.email,
        role: a.role,
        status: STATUS.PENDING,
        comment: null,
        approved_at: null
    }));

    // Potong quota per periode, rollback semua jika gagal
    const deducted = [];
    try {
        for (const snap of quotaSnapshots) {
            await updateQuota(snap.quota.id, {
                remaining_balance: snap.originalRemaining - snap.days,
                used_quota: snap.originalUsed + snap.days
            });
            deducted.push(snap);
        }

        const { data, error } = await createRequest({
            employee_id,
            timeoff_id,
            start_date,
            end_date,
            total_days,
            reason,
            status: STATUS.DRAFT,
            approval_logs,
            created_by_email: userEmail,
            updated_by_email: userEmail
        });

        if (error) throw new Error(error.message);
        if (!data || data.length === 0) {
            throw new Error("Gagal membuat draft");
        }

        return data;

    } catch (err) {
        // Rollback semua quota yang sudah dipotong
        for (const snap of deducted) {
            await updateQuota(snap.quota.id, {
                remaining_balance: snap.originalRemaining,
                used_quota: snap.originalUsed
            });
        }
        throw err;
    }
};

const updateDraftService = async (id, body, userEmail) => {
    const { start_date, end_date, reason } = body;

    const { data } = await findRequestById(id);

    if (!data) {
        throw new Error("Data tidak ditemukan");
    }

    if (data.status !== STATUS.DRAFT) {
        throw new Error("Hanya draft yang bisa diupdate");
    }

    // validasi tanggal
    if (start_date && end_date) {
        if (new Date(start_date) > new Date(end_date)) {
            throw new Error("Invalid date range");
        }
    }

    const newStart = start_date || data.start_date;
    const newEnd = end_date || data.end_date;

    await validateDateConflict(data.employee_id, newStart, newEnd);

    // === Rollback quota lama ===
    const oldPeriods = await calculateDaysByPeriod(data.start_date, data.end_date);
    for (const period of oldPeriods) {
        const periodDate = `${period.year}-01-01`;
        const { data: oldQuota } = await findByEmployeeAndTimeoff(data.employee_id, data.timeoff_id, periodDate);
        if (oldQuota) {
            await updateQuota(oldQuota.id, {
                remaining_balance: oldQuota.remaining_balance + period.days,
                used_quota: Math.max(0, oldQuota.used_quota - period.days)
            });
        }
    }

    // === Hitung hari baru ===
    const newPeriods = await calculateDaysByPeriod(newStart, newEnd);
    const newTotalDays = newPeriods.reduce((sum, p) => sum + p.days, 0);

    if (newTotalDays <= 0) {
        throw new Error("Tidak ada hari cuti valid");
    }

    // Validasi & siapkan quota baru
    const newQuotaSnapshots = [];
    for (const period of newPeriods) {
        const periodDate = `${period.year}-01-01`;
        const { data: freshQuota } = await findByEmployeeAndTimeoff(data.employee_id, data.timeoff_id, periodDate);

        if (!freshQuota) {
            throw new Error(`Kuota cuti untuk periode ${period.year} tidak ditemukan`);
        }

        if (freshQuota.remaining_balance < period.days) {
            throw new Error(`Kuota tidak mencukupi untuk periode ${period.year}`);
        }

        newQuotaSnapshots.push({ quota: freshQuota, days: period.days });
    }

    // Potong quota baru
    for (const snap of newQuotaSnapshots) {
        await updateQuota(snap.quota.id, {
            remaining_balance: snap.quota.remaining_balance - snap.days,
            used_quota: snap.quota.used_quota + snap.days
        });
    }

    // update request
    const { data: updated } = await updateRequest(id, {
        start_date: newStart,
        end_date: newEnd,
        total_days: newTotalDays,
        reason: reason ?? data.reason,
        updated_by_email: userEmail
    });

    return updated;
};

const submitService = async (id, userEmail) => {
    const { data } = await findRequestById(parseInt(id));

    if (!data) throw new Error("Data tidak ditemukan");

    if (![STATUS.DRAFT, STATUS.SUBMITTED].includes(data.status)) {
        throw new Error("Only draft or submitted requests can be processed");
    }

    const { data: updated } = await updateRequest(id, {
        status: STATUS.SUBMITTED,
        updated_by_email: userEmail
    });

    const firstApprover = data.approval_logs.find(
        a => a.status?.toUpperCase() === STATUS.PENDING
    );

    if (firstApprover) {
        sendApprovalEmail(
            firstApprover.email,
            firstApprover.approver_name
        ).catch(err => {
            console.error("Failed to send email:", err.message);
        });
    }

    return updated;
};

module.exports = {
    createDraftService,
    updateDraftService,
    submitService
};
