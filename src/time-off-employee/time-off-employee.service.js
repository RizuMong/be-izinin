const { findAll, findById, findByEmployeeAndTimeoff, createTimeOffEmployee, deleteTimeOffEmployee, updateTimeOffEmployee } = require("./time-off-employee.repository");

const validateFK = async (table, id, label) => {
    const { data } = await findById(table, id);

    if (!data) {
        const err = new Error(`${label} not found`);
        err.status = 404;
        throw err;
    }
};

const validateNonNegativeNumber = (value, label) => {
    if (value == null) {
        throw new Error(`${label} is required`);
    }

    if (typeof value !== "number") {
        throw new Error(`${label} must be a number`);
    }

    if (value < 0) {
        throw new Error(`${label} cannot be negative`);
    }
};

const getATimeOffEmployee = async (params) => {
    let {
        page = 1,
        limit = 10,
        sortBy = "created_at",
        order = "desc",
        id,
        employee_id,
        timeoff_id,
        period
    } = params;

    page = parseInt(page);
    limit = parseInt(limit);

    if (page < 1 || limit < 1) {
        throw new Error("Invalid pagination params");
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // whitelist sorting
    const allowedSort = ["full_name", "created_at"];
    if (!allowedSort.includes(sortBy)) {
        sortBy = "created_at";
    }

    // filter
    const filters = {};

    if (id) {
        filters.id = id;
    }

    if (employee_id) {
        filters.employee_id = employee_id;
    }

    if (timeoff_id) {
        filters.timeoff_id = timeoff_id;
    }

    if (period) {
        filters.period = period;
    }

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

const createTimeOffEmployeeService = async (body) => {
    const {
        employee_id,
        timeoff_id,
        period,
        total_quota,
        remaining_balance,
        used_quota
    } = body;

    if (!employee_id) {
        throw new Error("Employee is required");
    }

    if (!timeoff_id) {
        throw new Error("Time Off is required");
    }

    if (!period) {
        throw new Error("Period is required");
    }

    validateNonNegativeNumber(remaining_balance, "Remaining Balance");
    validateNonNegativeNumber(total_quota, "Total Quota");
    validateNonNegativeNumber(used_quota, "Used Quota");

    const isValidDate = /^\d{4}-\d{2}-\d{2}$/;
    if (!isValidDate.test(period)) {
        throw new Error("Invalid date format (YYYY-MM-DD expected)");
    }

    // FK validation
    await validateFK("master_employee", employee_id, "Employee");
    await validateFK("master_timeoff", timeoff_id, "Time Off");

    // duplicate validation
    const { data: existing } = await findByEmployeeAndTimeoff(
        employee_id,
        timeoff_id,
        period
    );

    if (existing) {
        throw new Error("Data time off employee untuk tahun ini sudah ada");
    }

    const { data, error } = await createTimeOffEmployee({
        employee_id,
        timeoff_id,
        period,
        total_quota,
        remaining_balance,
        used_quota
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

const updateTimeOffEmployeeService = async (id, body) => {
    const parsedId = parseInt(id);

    if (!parsedId || isNaN(parsedId)) {
        throw new Error("Invalid ID");
    }

    const {
        employee_id,
        timeoff_id,
        period,
        total_quota,
        remaining_balance,
        used_quota
    } = body;

    // source of truth from repository
    const { data: existing, error: existingError } =
        await findById("master_timeoff_employee", parsedId);

    if (existingError || !existing) {
        const err = new Error("Time Off Employee not found");
        err.status = 404;
        throw err;
    }

    const payload = {};

    if (employee_id !== undefined) {
        if (!employee_id) {
            throw new Error("Employee is required");
        }

        await validateFK("master_employee", employee_id, "Employee");
        payload.employee_id = employee_id;
    }

    if (timeoff_id !== undefined) {
        if (!timeoff_id) {
            throw new Error("Time Off is required");
        }

        await validateFK("master_timeoff", timeoff_id, "Time Off");
        payload.timeoff_id = timeoff_id;
    }

    if (total_quota !== undefined) {
        validateNonNegativeNumber(total_quota, "Total Quota");
        payload.total_quota = total_quota;
    }

    if (remaining_balance !== undefined) {
        validateNonNegativeNumber(remaining_balance, "Remaining Balance");
        payload.remaining_balance = remaining_balance;
    }

    if (used_quota !== undefined) {
        validateNonNegativeNumber(used_quota, "Used Quota");
        payload.used_quota = used_quota;
    }

    if (period !== undefined) {
        const isValidDate = /^\d{4}-\d{2}-\d{2}$/;
        if (!isValidDate.test(period)) {
            throw new Error("Invalid date format (YYYY-MM-DD expected)");
        }

        payload.period = period;
    }

    if (Object.keys(payload).length === 0) {
        throw new Error("No data provided for update");
    }

    const targetEmployeeId = payload.employee_id ?? existing.employee_id;
    const targetTimeoffId = payload.timeoff_id ?? existing.timeoff_id;
    const targetPeriod = payload.period ?? existing.period;

    const { data: duplicate } = await findByEmployeeAndTimeoff(
        targetEmployeeId,
        targetTimeoffId,
        targetPeriod
    );

    if (duplicate && duplicate.id !== parsedId) {
        throw new Error("Data time off employee untuk tahun ini sudah ada");
    }

    const { data, error } = await updateTimeOffEmployee(parsedId, payload);

    if (error) {
        throw new Error(error.message);
    }

    if (!data || data.length === 0) {
        const err = new Error("TimeOffEmployee not found");
        err.status = 404;
        throw err;
    }

    return data;
};

const deleteTimeOffEmployeeService = async (id) => {
    if (!id || isNaN(id)) {
        throw new Error("Invalid ID");
    }

    const { data, error } = await deleteTimeOffEmployee(id);

    if (error) {
        throw new Error(error.message);
    }

    if (!data || data.length === 0) {
        const err = new Error("Data tidak ditemukan");
        err.status = 404;
        throw err;
    }

    return data;
};

module.exports = {
    getATimeOffEmployee,
    createTimeOffEmployeeService,
    deleteTimeOffEmployeeService,
    updateTimeOffEmployeeService
};