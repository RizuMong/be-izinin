// request-timeoff.service.js
const {
    findAll,
    createRequest,
    updateRequest,
    findById,
    findTimeoffEmployee,
    getHolidays,
    findEmployeeById,
    findEmployeeByEmail
} = require("./request-time-off.repository");

const {
    updateTimeOffEmployee
} = require("../time-off-employee/time-off-employee.repository");

const { sendApprovalEmail, sendRejectEmail } = require("../utils/email/notification.service");
const { safeJson } = require("../utils/json");


const { TIMEOFF_APPROVERS } = require("./timeoff-approver.config");

const validateFK = async (table, id, label) => {
    const { data } = await findById(table, id);

    if (!data) {
        const err = new Error(`${label} not found`);
        err.status = 404;
        throw err;
    }
};

const buildApprovalLogs = () => {
    if (!Array.isArray(TIMEOFF_APPROVERS)) {
        throw new Error("TIMEOFF_APPROVERS config invalid");
    }

    return TIMEOFF_APPROVERS.map((a, index) => {
        if (!a.email || !a.employee_id) {
            throw new Error(`Invalid approver config at index ${index}`);
        }

        return {
            employee_id: a.employee_id,
            approver_name: a.approver_name || null,
            email: a.email,
            role: a.role || null,
            status: "PENDING",
            comment: null,
            approved_at: null
        };
    });
};

const STATUS = {
    DRAFT: "DRAFT",
    SUBMITTED: "SUBMITTED",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED"
};

// Map day names to JS getDay() index
const DAY_NAME_TO_INDEX = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
};

/**
 * Build holiday lookup structures from raw getHolidays() result.
 * - nationalSet  : Set of date strings ("YYYY-MM-DD") for is_national_holiday=true
 * - recurringDays: Set of getDay() indices for is_national_holiday=false (weekly recurring)
 */
const buildHolidayLookup = (holidays) => {
    const nationalSet = new Set();
    const recurringDays = new Set();

    for (const h of holidays) {
        if (h.is_national_holiday) {
            // Exact date — store as "YYYY-MM-DD"
            const dateStr = typeof h.date === "string"
                ? h.date.split("T")[0]
                : new Date(h.date).toISOString().split("T")[0];
            nationalSet.add(dateStr);
        } else {
            // Recurring weekly — match by day name
            const idx = DAY_NAME_TO_INDEX[h.name?.toLowerCase()];
            if (idx !== undefined) {
                recurringDays.add(idx);
            }
        }
    }

    return { nationalSet, recurringDays };
};

const calculateDaysByPeriod = async (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const { data: holidays } = await getHolidays(start, end);
    const { nationalSet, recurringDays } = buildHolidayLookup(holidays);

    // Kelompokkan hari kerja valid per tahun
    const periodMap = {};

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        const dayIndex = d.getDay();
        const year = d.getFullYear();

        const isNationalHoliday = nationalSet.has(dateStr);
        const isRecurringHoliday = recurringDays.has(dayIndex);

        if (!isNationalHoliday && !isRecurringHoliday) {
            periodMap[year] = (periodMap[year] || 0) + 1;
        }
    }

    // Ubah ke array: [{ year, days }]
    return Object.entries(periodMap).map(([year, days]) => ({
        year: parseInt(year),
        days
    }));
};

const getAllTimeOffRequestService = async (params, user) => {
    let {
        page = 1,
        limit = 10,
        sortBy = "created_at",
        order = "desc",
        employee_id,
        timeoff_id,
        status,
        start_date,
        end_date
    } = params;

    page = parseInt(page);
    limit = parseInt(limit);

    if (page < 1 || limit < 1) {
        throw new Error("Invalid pagination params");
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const allowedSort = ["created_at", "start_date", "end_date", "status"];

    if (!allowedSort.includes(sortBy)) {
        sortBy = "created_at";
    }

    const filters = {};

    if (employee_id) filters.employee_id = employee_id;
    if (timeoff_id) filters.timeoff_id = timeoff_id;

    if (status) {
        filters.status = status
            .split(",")
            .map(s => s.trim().toUpperCase());
    }

    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;

    const { data, error, count } = await findAll({
        from,
        to,
        sortBy,
        order,
        filters
    });

    if (error) {
        throw new Error(error.message);
    }

    return {
        data,
        meta: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit)
        }
    };
};

const createDraftService = async (body) => {
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
    };

    // FK validation
    await validateFK("master_employee", employee_id, "Employee");
    await validateFK("master_timeoff", timeoff_id, "Time Off");

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
        const { data: quota } = await findTimeoffEmployee(employee_id, timeoff_id, periodDate);

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
        status: "PENDING",
        comment: null,
        approved_at: null
    }));

    // Potong quota per periode, rollback semua jika gagal
    const deducted = [];
    try {
        for (const snap of quotaSnapshots) {
            await updateTimeOffEmployee(snap.quota.id, {
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
            approval_logs
        });

        if (error) throw new Error(error.message);
        if (!data || data.length === 0) {
            throw new Error("Gagal membuat draft");
        }

        return data;

    } catch (err) {
        // Rollback semua quota yang sudah dipotong
        for (const snap of deducted) {
            await updateTimeOffEmployee(snap.quota.id, {
                remaining_balance: snap.originalRemaining,
                used_quota: snap.originalUsed
            });
        }

        throw err;
    }
};

const updateDraftService = async (id, body) => {
    const { start_date, end_date, reason } = body;

    const { data } = await findById("t_request_timeoff", id);

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

    // === Rollback quota lama (per periode lama) ===
    const oldPeriods = await calculateDaysByPeriod(data.start_date, data.end_date);
    for (const period of oldPeriods) {
        const periodDate = `${period.year}-01-01`;
        const { data: oldQuota } = await findTimeoffEmployee(data.employee_id, data.timeoff_id, periodDate);
        if (oldQuota) {
            await updateTimeOffEmployee(oldQuota.id, {
                remaining_balance: oldQuota.remaining_balance + period.days,
                used_quota: Math.max(0, oldQuota.used_quota - period.days)
            });
        }
    }

    // === Hitung hari baru per periode ===
    const newPeriods = await calculateDaysByPeriod(newStart, newEnd);
    const newTotalDays = newPeriods.reduce((sum, p) => sum + p.days, 0);

    if (newTotalDays <= 0) {
        throw new Error("Tidak ada hari cuti valid");
    }

    // Validasi & siapkan quota baru per periode
    const newQuotaSnapshots = [];
    for (const period of newPeriods) {
        const periodDate = `${period.year}-01-01`;
        const { data: quota } = await findTimeoffEmployee(data.employee_id, data.timeoff_id, periodDate);

        if (!quota) {
            throw new Error(`Kuota cuti untuk periode ${period.year} tidak ditemukan`);
        }

        // Ambil nilai terkini setelah rollback
        const { data: freshQuota } = await findTimeoffEmployee(data.employee_id, data.timeoff_id, periodDate);
        if (freshQuota.remaining_balance < period.days) {
            throw new Error(`Kuota tidak mencukupi untuk periode ${period.year}`);
        }

        newQuotaSnapshots.push({ quota: freshQuota, days: period.days });
    }

    // Potong quota baru per periode
    for (const snap of newQuotaSnapshots) {
        await updateTimeOffEmployee(snap.quota.id, {
            remaining_balance: snap.quota.remaining_balance - snap.days,
            used_quota: snap.quota.used_quota + snap.days
        });
    }

    // update request
    const { data: updated } = await updateRequest(id, {
        start_date: newStart,
        end_date: newEnd,
        total_days: newTotalDays,
        reason: reason ?? data.reason
    });

    return updated;
};

const submitService = async (id) => {
    const { data } = await findById("t_request_timeoff", parseInt(id));

    if (!data) throw new Error("Data tidak ditemukan");

    if (data.status !== STATUS.DRAFT) {
        throw new Error("Hanya draft yang bisa disubmit");
    }

    const { data: updated } = await updateRequest(id, {
        status: STATUS.SUBMITTED
    });

    const firstApprover = data.approval_logs.find(
        a => a.status?.toUpperCase() === "PENDING"
    );

    if (firstApprover) {
        console.log("Sending email to:", firstApprover.email);

        sendApprovalEmail(
            firstApprover.email,
            firstApprover.approver_name
        ).catch(err => {
            console.error("Failed to send email:", err.message);
        });
    }

    return updated;
};

const approveService = async (id, userEmail, body) => {
    const { reason } = body;

    const { data } = await findById("t_request_timeoff", parseInt(id));

    if (!data) throw new Error("Data tidak ditemukan");

    if (data.status !== STATUS.SUBMITTED) {
        throw new Error("Status tidak valid");
    }

    const approver = data.approval_logs.find(a => a.email === userEmail);

    if (!approver) {
        throw new Error("Anda tidak memiliki akses untuk approve");
    }

    if (approver.status !== "PENDING") {
        throw new Error("Anda sudah memproses request ini");
    }

    const currentApprover = data.approval_logs.find(a => a.status === "PENDING");

    if (!currentApprover || approver.email !== currentApprover.email) {
        throw new Error("Bukan giliran Anda untuk approve");
    }

    const updatedLogs = data.approval_logs.map(a => {
        if (a.email === userEmail) {
            return {
                ...a,
                status: "APPROVED",
                comment: reason,
                approved_at: new Date().toISOString()
            };
        }
        return a;
    });

    const nextApprover = updatedLogs.find(
        a => a.status?.toUpperCase() === "PENDING"
    );

    if (nextApprover) {
        console.log("Sending email to:", nextApprover.email);

        sendApprovalEmail(
            nextApprover.email,
            nextApprover.approver_name
        ).catch(err => {
            console.error("Failed to send approval email:", err.message);
        });
    }

    const allApproved = updatedLogs.every(a => a.status === "APPROVED");

    return await updateRequest(id, {
        status: allApproved ? STATUS.APPROVED : STATUS.SUBMITTED,
        approval_logs: updatedLogs
    });
};

const rejectService = async (id, userEmail, body) => {
    const { reason } = body;

    const { data } = await findById("t_request_timeoff", parseInt(id));
    console.log(data);
    

    if (!data) throw new Error("Data tidak ditemukan");

    if (data.status !== STATUS.SUBMITTED) {
        throw new Error("Status tidak valid");
    }

    const approver = data.approval_logs.find(a => a.email === userEmail);

    if (!approver) {
        throw new Error("Anda tidak memiliki akses untuk reject");
    }

    if (approver.status !== "PENDING") {
        throw new Error("Anda sudah memproses request ini");
    }

    const currentApprover = data.approval_logs.find(a => a.status === "PENDING");

    if (!currentApprover || approver.email !== currentApprover.email) {
        throw new Error("Bukan giliran Anda untuk melakukan reject");
    }

    const updatedLogs = data.approval_logs.map(a => {
        if (a.email === userEmail) {
            return {
                ...a,
                status: "REJECTED",
                comment: reason,
                approved_at: new Date().toISOString()
            };
        }
        return a;
    });

    // Kembalikan quota per periode (karena pemotongan sudah dilakukan per periode)
    const rejectPeriods = await calculateDaysByPeriod(data.start_date, data.end_date);
    for (const period of rejectPeriods) {
        const periodDate = `${period.year}-01-01`;
        const { data: quota } = await findTimeoffEmployee(data.employee_id, data.timeoff_id, periodDate);

        if (!quota) {
            throw new Error(`Kuota cuti untuk periode ${period.year} tidak ditemukan`);
        }

        await updateTimeOffEmployee(quota.id, {
            remaining_balance: quota.remaining_balance + period.days,
            used_quota: Math.max(0, quota.used_quota - period.days)
        });
    }

    // const { data: employee } = await findEmployeeById(parseInt(data.employee_id));

    // if (!employee) {
    //     throw new Error("Employee tidak ditemukan");
    // }

    // const requesterEmail = employee.email;
    // const requesterName = employee.name;

    // kalau butuh
    // sendRejectEmail(requesterEmail, requesterName).catch(err => {
    //     console.error("Failed to send reject email:", err.message);
    // });


    return await updateRequest(id, {
        status: STATUS.REJECTED,
        approval_logs: updatedLogs
    });
};

module.exports = {
    getAllTimeOffRequestService,
    createDraftService,
    updateDraftService,
    submitService,
    approveService,
    rejectService
};