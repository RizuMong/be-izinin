// request-timeoff.service.js
const {
    findAll,
    createRequest,
    updateRequest,
    findById,
    findOverlap,
    getHolidays
} = require("./request-time-off.repository");

const {
    findByEmployeeAndTimeoff,
    updateTimeOffEmployee
} = require("../time-off-employee/time-off-employee.repository");

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
    const { employee_id, timeoff_id, start_date, end_date, reason } = body;

    if (!employee_id || !timeoff_id || !start_date || !end_date) {
        throw new Error("Incomplete data");
    }

    if (new Date(start_date) > new Date(end_date)) {
        throw new Error("Invalid date range");
    }

    const { data: overlap } = await findOverlap(
        employee_id,
        start_date,
        end_date
    );

    if (overlap.length > 0) {
        throw new Error("Tanggal sudah diajukan");
    }

    const total_days = await calculateDays(start_date, end_date);

    if (total_days <= 0) {
        throw new Error("Tidak ada hari cuti valid");
    }

    const { data: quota } = await findByEmployeeAndTimeoff(
        employee_id,
        timeoff_id,
        start_date
    );

    if (!quota || quota.remaining_balance < total_days) {
        throw new Error("Kuota tidak mencukupi");
    }

    // potong quota
    await updateTimeOffEmployee(quota.id, {
        remaining_balance: quota.remaining_balance - total_days,
        used_quota: quota.used_quota + total_days
    });

    const approval_logs = [
        {
            approver_id: "MANAGER_1",
            approver_name: "Manager",
            role: "MANAGER",
            status: "PENDING",
            comment: null,
            approved_at: null
        }
    ];

    const { data } = await createRequest({
        employee_id,
        timeoff_id,
        start_date,
        end_date,
        total_days,
        reason,
        status: STATUS.DRAFT,
        approval_logs
    });

    return data;
};

const updateDraftService = async (id, body) => {
    const { start_date, end_date, reason } = body;

    const { data } = await findById(id);

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

    // cek overlap (exclude dirinya sendiri)
    const { data: overlap } = await findOverlap(
        data.employee_id,
        newStart,
        newEnd
    );

    const filteredOverlap = overlap.filter(item => item.id !== id);

    if (filteredOverlap.length > 0) {
        throw new Error("Tanggal sudah diajukan");
    }

    // hitung ulang hari
    const newTotalDays = await calculateDays(newStart, newEnd);

    if (newTotalDays <= 0) {
        throw new Error("Tidak ada hari cuti valid");
    }

    // ambil quota
    const { data: quota } = await findByEmployeeAndTimeoff(
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
    const { data } = await findById(id);

    if (!data) throw new Error("Data tidak ditemukan");
    if (data.status !== STATUS.DRAFT) {
        throw new Error("Hanya draft yang bisa disubmit");
    }

    return await updateRequest(id, { status: STATUS.SUBMITTED });
};

const approveService = async (id) => {
    const { data } = await findById(id);

    if (!data) throw new Error("Data tidak ditemukan");
    if (data.status !== STATUS.SUBMITTED) {
        throw new Error("Status tidak valid");
    }

    const logs = data.approval_logs.map(a => ({
        ...a,
        status: "APPROVED",
        approved_at: new Date().toISOString()
    }));

    return await updateRequest(id, {
        status: STATUS.APPROVED,
        approval_logs: logs
    });
};

const rejectService = async (id) => {
    const { data } = await findById(id);

    if (!data) throw new Error("Data tidak ditemukan");
    if (data.status !== STATUS.SUBMITTED) {
        throw new Error("Status tidak valid");
    }

    const logs = data.approval_logs.map(a => ({
        ...a,
        status: "REJECTED",
        approved_at: new Date().toISOString()
    }));

    // balikin quota
    const { data: quota } = await findByEmployeeAndTimeoff(
        data.employee_id,
        data.timeoff_id,
        data.start_date
    );

    await updateTimeOffEmployee(quota.id, {
        remaining_balance: quota.remaining_balance + data.total_days,
        used_quota: quota.used_quota - data.total_days
    });

    return await updateRequest(id, {
        status: STATUS.REJECTED,
        approval_logs: logs
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