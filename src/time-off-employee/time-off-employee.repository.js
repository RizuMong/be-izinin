// time-off-employee.repository.js
const db = require("../db");

const findAll = async ({
    from,
    to,
    sortBy,
    order,
    filters = {}
}) => {
    let query = db
        .from("master_timeoff_employee")
        .select("*", { count: "exact" });

    // filters
    if (filters.id) {
        query = query.eq("id", filters.id);
    }

    if (filters.employee_id) {
        query = query.eq("employee_id", filters.employee_id);
    }

    if (filters.timeoff_id) {
        query = query.eq("timeoff_id", filters.timeoff_id);
    }

    if (filters.period) {
        query = query.ilike("period", filters.period);
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

const findByEmployeeAndTimeoff = async (employee_id, timeoff_id, period) => {
    const year = new Date(period).getFullYear();

    const startOfYear = `${year}-01-01`;
    const endOfYear = `${year}-12-31`;

    const result = await db
        .from("master_timeoff_employee")
        .select("*")
        .eq("employee_id", employee_id)
        .eq("timeoff_id", timeoff_id)
        .gte("period", startOfYear)
        .lte("period", endOfYear);
        
    return result;
};

const createTimeOffEmployee = async (payload) => {
    return await db
        .from("master_timeoff_employee")
        .insert(payload)
        .select();
};

const deleteTimeOffEmployee = async (id) => {
    return await db
        .from("master_timeoff_employee")
        .delete()
        .eq("id", id)
        .select(); // biar tahu data kehapus
};

const updateTimeOffEmployee = async (id, payload) => {
    return await db
        .from("master_timeoff_employee")
        .update(payload)
        .eq("id", id)
        .select();
};

module.exports = {
    findAll,
    findById,
    findByEmployeeAndTimeoff,
    createTimeOffEmployee,
    updateTimeOffEmployee,
    deleteTimeOffEmployee
};