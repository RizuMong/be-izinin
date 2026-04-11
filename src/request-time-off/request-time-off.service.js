// request-timeoff.service.js
const {
    findAll,
    createRequest,
    updateRequest,
    findById,
    findTimeoffEmployee,
    getHolidays,
    findEmployeeById
} = require("./request-time-off.repository");

const {
    updateTimeOffEmployee
} = require("../time-off-employee/time-off-employee.repository");

const { sendApprovalEmail, sendRejectEmail } = require("../utils/email/notification.service");

const { TIMEOFF_APPROVERS } = require("./timeoff-approver.config");

const validateFK = async (table, id, label) => {
    const { data } = await findById(table, id);

    if (!data) {
        const err = new Error(`${label} not found`);
        err.status = 404;
        throw err;
    }
};

const STATUS = {
    DRAFT: "DRAFT",
    SUBMITTED: "SUBMITTED",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED"
};

const calculateDays = async (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    let total = 0;

    const { data: holidays } = await getHolidays(start, end);
    const holidaySet = new Set(holidays.map(h => h.date));

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];

        if (!holidaySet.has(dateStr)) {
            total++;
        }
    }

    return total;
};

const getAllTimeOffRequestService = async (params) => {
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

    // whitelist sorting
    const allowedSort = ["created_at", "start_date", "end_date", "status"];

    if (!allowedSort.includes(sortBy)) {
        sortBy = "created_at";
    }

    // build filters
    const filters = {};

    if (employee_id) filters.employee_id = employee_id;
    if (timeoff_id) filters.timeoff_id = timeoff_id;
    if (status) filters.status = status;
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

    const total_days = await calculateDays(start_date, end_date);

    if (total_days <= 0) {
        throw new Error("Tidak ada hari cuti valid");
    }

    const { data: quota } = await findTimeoffEmployee(
        employee_id,
        timeoff_id,
        start_date
    );

    if (!quota || quota.remaining_balance < total_days) {
        throw new Error("Kuota tidak mencukupi");
    }

    const originalRemaining = quota.remaining_balance;
    const originalUsed = quota.used_quota;

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

    try {
        await updateTimeOffEmployee(quota.id, {
            remaining_balance: originalRemaining - total_days,
            used_quota: originalUsed + total_days
        });

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
        await updateTimeOffEmployee(quota.id, {
            remaining_balance: originalRemaining,
            used_quota: originalUsed
        });

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

    // hitung ulang hari
    const newTotalDays = await calculateDays(newStart, newEnd);

    if (newTotalDays <= 0) {
        throw new Error("Tidak ada hari cuti valid");
    }

    // ambil quota
    const { data: quota } = await findTimeoffEmployee(
        data.employee_id,
        data.timeoff_id,
        newStart
    );

    // rollback quota lama
    await updateTimeOffEmployee(quota.id, {
        remaining_balance: quota.remaining_balance + data.total_days,
        used_quota: quota.used_quota - data.total_days
    });

    // cek cukup tidak setelah rollback
    const updatedRemaining = quota.remaining_balance + data.total_days;

    if (updatedRemaining < newTotalDays) {
        throw new Error("Kuota tidak mencukupi");
    }

    // potong quota baru
    await updateTimeOffEmployee(quota.id, {
        remaining_balance: updatedRemaining - newTotalDays,
        used_quota: quota.used_quota - data.total_days + newTotalDays
    });

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

        await sendApprovalEmail(
            nextApprover.email,
            nextApprover.approver_name
        );
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

    const { data: quota } = await findTimeoffEmployee(
        data.employee_id,
        data.timeoff_id,
        data.start_date
    );

    if (!quota) {
        throw new Error("Kuota cuti tidak ditemukan");
    }

    const newRemaining = quota.remaining_balance + data.total_days;
    const newUsed = Math.max(0, quota.used_quota - data.total_days);

    await updateTimeOffEmployee(quota.id, {
        remaining_balance: newRemaining,
        used_quota: newUsed
    });

    const { data: employee } = await findEmployeeById(data.employee_id);

    if (!employee) {
        throw new Error("Employee tidak ditemukan");
    }

    const requesterEmail = employee.email;
    const requesterName = employee.name;

    console.log("Sending reject email to:", requesterEmail);

    await sendRejectEmail(requesterEmail, requesterName);

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