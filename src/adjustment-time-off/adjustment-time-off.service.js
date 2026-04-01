const { findAll, findById, createAdjustmentTimeOff, deleteAdjustmentTimeOff, updateAdjustmentTimeOff } = require("./adjustment-time-off.repository");
const {
    findByEmployeeAndTimeoff,
    createTimeOffEmployee,
    updateTimeOffEmployee,
} = require("../time-off-employee/time-off-employee.repository");

const validateFK = async (table, id, label) => {
    const { data } = await findById(table, id);

    if (!data) {
        const err = new Error(`${label} not found`);
        err.status = 404;
        throw err;
    }
};

const OPERATION = {
    PLUS: "PENAMBAHAN",
    MINUS: "PENGURANGAN"
};

const getAAdjustmentTimeOff = async (params) => {
    let {
        page = 1,
        limit = 10,
        sortBy = "created_at",
        order = "desc",
        id,
        employee_id,
        timeoff_id,
        period,
        operation
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

    if (operation) {
        filters.operation = operation;
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

const createAdjustmentTimeOffService = async (body) => {
    const {
        employee_id,
        timeoff_id,
        total_quota,
        period,
        operation,
    } = body;

    // validation
    if (!employee_id) {
        throw new Error("Employee is required");
    }

    if (!timeoff_id) {
        throw new Error("Time Off is required");
    }

    if (!period) {
        throw new Error("Period is required");
    }

    if (total_quota === undefined || total_quota === null) {
        throw new Error("Total Quota is required");
    }

    if (total_quota <= 0) {
        throw new Error("Total Quota must be greater than 0");
    }

    if (!operation) {
        throw new Error("Operation is required");
    }

    const normalizedOperation = operation.toUpperCase();

    if (![OPERATION.PLUS, OPERATION.MINUS].includes(normalizedOperation)) {
        throw new Error("Invalid operation (PENAMBAHAN / PENGURANGAN)");
    }

    const isValidDate = /^\d{4}-\d{2}-\d{2}$/;
    if (!isValidDate.test(period)) {
        throw new Error("Invalid date format (YYYY-MM-DD expected)");
    }

    // FK validation
    await validateFK("master_employee", employee_id, "Employee");
    await validateFK("master_timeoff", timeoff_id, "Time Off");

    // check existing (by year)
    const { data: existing, error: existingError } =
        await findByEmployeeAndTimeoff(employee_id, timeoff_id, period);

    if (existingError) {
        throw new Error(existingError.message);
    }

    // business logic
    if (!existing) {
        if (normalizedOperation === OPERATION.MINUS) {
            throw new Error("Tidak bisa melakukan pengurangan, data belum ada");
        }

        const { error: insertError } = await createTimeOffEmployee({
            employee_id,
            timeoff_id,
            period,
            total_quota,
            remaining_balance: total_quota,
            used_quota: 0
        });

        if (insertError) {
            throw new Error(insertError.message);
        }
    } else {
        let newTotal = existing.total_quota;
        let newRemaining = existing.remaining_balance;
        let newUsed = existing.used_quota;

        if (normalizedOperation === OPERATION.PLUS) {
            newTotal += total_quota;
            newRemaining += total_quota;
        }

        if (normalizedOperation === OPERATION.MINUS) {
            if (existing.remaining_balance === 0) {
                throw new Error("Sisa cuti sudah 0");
            }

            if (existing.remaining_balance < total_quota) {
                throw new Error("Sisa cuti tidak mencukupi");
            }

            newRemaining -= total_quota;
            newUsed += total_quota;
        }

        const { error: updateError } = await updateTimeOffEmployee(
            existing.id,
            {
                total_quota: newTotal,
                remaining_balance: newRemaining,
                used_quota: newUsed
            }
        );

        if (updateError) {
            throw new Error(updateError.message);
        }
    }

    // insert adjustment log
    const { data, error } = await createAdjustmentTimeOff({
        employee_id,
        timeoff_id,
        total_quota,
        period,
        operation: normalizedOperation,
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

const deleteAdjustmentTimeOffService = async (id) => {
    if (!id || isNaN(id)) {
        throw new Error("Invalid ID");
    }

    const { data, error } = await deleteAdjustmentTimeOff(id);

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

const updateAdjustmentTimeOffService = async (id, body) => {
    const parsedId = parseInt(id);

    if (!parsedId || isNaN(parsedId)) {
        throw new Error("Invalid ID");
    }

    const {
        employee_id,
        timeoff_id,
        total_quota,
        period,
        operation,
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

    if (operation !== undefined) {
        if (!operation) {
            throw new Error("Operation is required");
        }

        payload.operation = operation;
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


    const { data, error } = await updateAdjustmentTimeOff(parsedId, payload);

    if (error) {
        throw new Error(error.message);
    }

    if (!data || data.length === 0) {
        const err = new Error("AdjustmentTimeOff not found");
        err.status = 404;
        throw err;
    }

    return data;
};

module.exports = {
    getAAdjustmentTimeOff,
    createAdjustmentTimeOffService,
    deleteAdjustmentTimeOffService,
    updateAdjustmentTimeOffService
};