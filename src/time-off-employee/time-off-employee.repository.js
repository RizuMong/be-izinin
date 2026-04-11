// time-off-employee.repository.js
const db = require("../db");

const safeNumber = (val) => {
    if (val === undefined || val === "undefined" || val === "") return null;
    const parsed = parseInt(val);
    return isNaN(parsed) ? null : parsed;
};

const findAll = async ({
    from,
    to,
    sortBy,
    order,
    filters = {}
}) => {
    let query = db
        .from("master_timeoff_employee")
        .select(`
            *,
            employee:master_employee (
                id,
               name:full_name
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

const findTimeoffEmployee = async (employee_id, timeoff_id, period) => {
    const safeEmployeeId = safeNumber(employee_id);
    const safeTimeoffId = safeNumber(timeoff_id);

    if (!safeEmployeeId || !safeTimeoffId || !period) {
        return { data: null, error: null };
    }

    const year = new Date(period).getFullYear();

    return await db
        .from("master_timeoff_employee")
        .select("*")
        .eq("employee_id", safeEmployeeId)
        .eq("timeoff_id", safeTimeoffId)
        .filter("period", "gte", `${year}-01-01`)
        .filter("period", "lte", `${year}-12-31`)
        .maybeSingle();
};

const findByEmployeeAndTimeoff = async (employee_id, timeoff_id, period) => {
    const safeEmployeeId = safeNumber(employee_id);
    const safeTimeoffId = safeNumber(timeoff_id);

    if (!safeEmployeeId || !safeTimeoffId || !period) {
        return { data: null, error: null };
    }

    return await db
        .from("master_timeoff_employee")
        .select("*")
        .eq("employee_id", safeEmployeeId)
        .eq("timeoff_id", safeTimeoffId)
        .eq("period", period)
        .maybeSingle();
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
        .select();
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
    deleteTimeOffEmployee,
    findTimeoffEmployee
};