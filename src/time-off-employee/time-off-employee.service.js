const { findAll, findById, createTimeOffEmployee, deleteTimeOffEmployee, updateTimeOffEmployee } = require("./time-off-employee.repository");

const validateFK = async (table, id, label) => {
    const { data } = await findById(table, id);

    if (!data) {
        const err = new Error(`${label} not found`);
        err.status = 404;
        throw err;
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

    if (!total_quota) {
        throw new Error("Total Quota is required");
    }

    if (!remaining_balance) {
        throw new Error("Remaining Balance is required");
    }

    if (!used_quota) {
        throw new Error("Used Quota is required");
    }

    const isValidDate = /^\d{4}-\d{2}-\d{2}$/;
    if (!isValidDate.test(period)) {
        throw new Error("Invalid date format (YYYY-MM-DD expected)");
    }

    // FK validation
    await validateFK("master_employee", employee_id, "Employee");
    await validateFK("master_timeoff", timeoff_id, "Time Off");

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
        if (!total_quota) {
            throw new Error("Total Quota is required");
        }

        payload.total_quota = total_quota;
    }

    if (remaining_balance !== undefined) {
        if (!remaining_balance) {
            throw new Error("Remaining Balance is required");
        }

        payload.remaining_balance = remaining_balance;
    }

    if (used_quota !== undefined) {
        if (!used_quota) {
            throw new Error("Used Quota is required");
        }

        payload.used_quota = used_quota;
    }

    if (period !== undefined) {
        if (!period) {
            throw new Error("Period is required");
        }

        const isValidDate = /^\d{4}-\d{2}-\d{2}$/;
        if (!isValidDate.test(period)) {
            throw new Error("Invalid date format (YYYY-MM-DD expected)");
        }

        payload.period = period;
    }

    if (Object.keys(payload).length === 0) {
        throw new Error("No data provided for update");
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

module.exports = {
    getATimeOffEmployee,
    createTimeOffEmployeeService,
    deleteTimeOffEmployeeService,
    updateTimeOffEmployeeService
};