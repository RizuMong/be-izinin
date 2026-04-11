// request-time-off.repository

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
    .from("t_request_timeoff")
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
    if (filters.employee_id) {
        query = query.eq("employee_id", filters.employee_id);
    }

    if (filters.timeoff_id) {
        query = query.eq("timeoff_id", filters.timeoff_id);
    }

    if (filters.status) {
        query = query.eq("status", filters.status);
    }

    if (filters.start_date) {
        query = query.gte("start_date", filters.start_date);
    }

    if (filters.end_date) {
        query = query.lte("end_date", filters.end_date);
    }

    // sorting
    query = query.order(sortBy, { ascending: order === "asc" });

    // pagination
    query = query.range(from, to);

    return await query;
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

const createRequest = async (payload) => {
    return await db
        .from("t_request_timeoff")
        .insert(payload)
        .select();
};

const updateRequest = async (id, payload) => {
    return await db
        .from("t_request_timeoff")
        .update(payload)
        .eq("id", id)
        .select();
};

const findById = async (table, id) => {
    return await db
        .from(table)
        .select("id")
        .eq("id", id)
        .select("*", { count: "exact" }).single();
};

const findOverlap = async (employee_id, start_date, end_date) => {
    return await db
        .from("t_request_timeoff")
        .select("*")
        .eq("employee_id", employee_id)
        .or(`start_date.lte.${end_date},end_date.gte.${start_date}`);
};

const getHolidays = async (start, end) => {
    return await db
        .from("master_holiday")
        .select("date")
        .gte("date", start)
        .lte("date", end);
};

const findEmployeeById = async (id) => {
    return await db
        .from("master_employee")
        .select("id, name, email")
        .eq("id", id)
        .maybeSingle();
};

module.exports = {
    findAll,
    createRequest,
    updateRequest,
    findById,
    findOverlap,
    getHolidays,
    findTimeoffEmployee,
    findEmployeeById
};