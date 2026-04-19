const {
    findAdjustments,
    findAdjustmentById,
    createAdjustment,
    deleteAdjustment,
    updateAdjustment,
    findByEmployeeAndTimeoff,
    updateQuota
} = require("../repository/timeoff.repository");

const getAdjustments = async (params) => {
    let {
        page = 1,
        limit = 10,
        sortBy = "created_at",
        order = "desc",
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

    const filters = {
        employee_id: parseInt(employee_id),
        timeoff_id: parseInt(timeoff_id),
        period,
        operation
    };

    const { data, error, count } = await findAdjustments({
        from,
        to,
        sortBy,
        order,
        filters
    });

    if (error) throw new Error(error.message);

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
    const { employee_id, timeoff_id, period, total_quota, operation, reason } = body;

    if (!employee_id) throw new Error("Employee is required");
    if (!timeoff_id) throw new Error("Time Off is required");
    if (!period) throw new Error("Period is required");
    if (!total_quota) throw new Error("Total Quota is required");
    if (!operation) throw new Error("Operation is required");

    // Sync to master_timeoff_employee (quota)
    const { data: quota } = await findByEmployeeAndTimeoff(employee_id, timeoff_id, period);

    if (!quota) {
        throw new Error(`Master Kuota not found for Employee ${employee_id}, TimeOff ${timeoff_id}, Period ${period}`);
    }

    const isAddition = operation === "ADD" || operation === "PENAMBAHAN";

    const newTotal = isAddition 
        ? quota.total_quota + total_quota 
        : Math.max(0, quota.total_quota - total_quota);
    
    const newRemaining = isAddition
        ? quota.remaining_balance + total_quota
        : Math.max(0, quota.remaining_balance - total_quota);

    await updateQuota(quota.id, {
        total_quota: newTotal,
        remaining_balance: newRemaining
    });

    const { data, error } = await createAdjustment({
        employee_id,
        timeoff_id,
        period,
        total_quota,
        operation,
        reason
    });

    if (error) throw new Error(error.message);

    return data;
};

const deleteAdjustmentTimeOffService = async (id) => {
    if (!id || isNaN(id)) throw new Error("Invalid ID");

    const { data, error } = await deleteAdjustment(id);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("Data tidak ditemukan");

    return data;
};

const updateAdjustmentTimeOffService = async (id, body) => {
    const parsedId = parseInt(id);
    if (!parsedId || isNaN(parsedId)) throw new Error("Invalid ID");

    const { data, error } = await updateAdjustment(parsedId, body);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("Data tidak ditemukan");

    return data;
};

module.exports = {
    getAdjustments,
    createAdjustmentTimeOffService,
    deleteAdjustmentTimeOffService,
    updateAdjustmentTimeOffService
};
