const db = require("../db");

const findAll = async ({
    from,
    to,
    sortBy,
    order,
    filters = {}
}) => {
    let query = db
        .from("t_timeoff_adjustment")
        .select(`
        *,
        employee:master_employee (
            id,
            full_name
        ),
        time_off:master_timeoff (
            id,
            name
        )
    `, { count: "exact" });

    // filters
    if (filters.id) {
        query = query.eq("id", filters.id);
    }

    if (filters.employee_id !== undefined && !isNaN(filters.employee_id)) {
        query = query.eq("employee_id", filters.employee_id);
    }

    if (filters.timeoff_id) {
        query = query.eq("timeoff_id", filters.timeoff_id);
    }

    if (filters.period) {
        query = query.ilike("period", filters.period);
    }

    if (filters.operation) {
        query = query.ilike("operation", filters.operation);
    }

    // Sorting
    query = query.order(sortBy, { ascending: order === "asc" });

    // Pagination
    query = query.range(from, to);

    return await query;
};

const findById = async (table, id) => {
    return await db
        .from(table)
        .select("id")
        .eq("id", id)
        .single();
};

const createAdjustmentTimeOff = async (payload) => {
    return await db
        .from("t_timeoff_adjustment")
        .insert(payload)
        .select();
};

const deleteAdjustmentTimeOff = async (id) => {
    return await db
        .from("t_timeoff_adjustment")
        .delete()
        .eq("id", id)
        .select(); // biar tahu data kehapus
};

const updateAdjustmentTimeOff = async (id, payload) => {
    return await db
        .from("t_timeoff_adjustment")
        .update(payload)
        .eq("id", id)
        .select();
};

module.exports = {
    findAll,
    findById,
    createAdjustmentTimeOff,
    deleteAdjustmentTimeOff,
    updateAdjustmentTimeOff
};