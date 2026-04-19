const db = require("../../../db");

const safeNumber = (val) => {
    if (val === undefined || val === "undefined" || val === "") return null;
    const parsed = parseInt(val);
    return isNaN(parsed) ? null : parsed;
};

// === REQUESTS ===

const findRequests = async ({
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
        if (Array.isArray(filters.status)) {
            query = query.in("status", filters.status);
        } else {
            query = query.eq("status", filters.status);
        }
    }

    if (filters.start_date) {
        query = query.gte("start_date", filters.start_date);
    }

    if (filters.end_date) {
        query = query.lte("end_date", filters.end_date);
    }

    if (filters.created_by_email) {
        query = query.eq("created_by_email", filters.created_by_email);
    }

    // sorting
    query = query.order(sortBy, { ascending: order === "asc" });

    // pagination
    if (from !== undefined && to !== undefined) {
        query = query.range(from, to);
    }

    return await query;
};

const findRequestById = async (id) => {
    return await db
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
        `)
        .eq("id", id)
        .single();
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

const findOverlap = async (employee_id, start_date, end_date) => {
    return await db
        .from("t_request_timeoff")
        .select("start_date, end_date")
        .eq("employee_id", employee_id)
        .in("status", ["DRAFT", "PENDING", "SUBMITTED", "APPROVED"])
        .lte("start_date", end_date)
        .gte("end_date", start_date)
        .limit(1);
};

// === APPROVALS ===

const findPendingApprovals = async () => {
    return await db
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
        `)
        .eq("status", "SUBMITTED");
};

// === ADJUSTMENTS ===

const findAdjustments = async ({
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

    if (filters.id) query = query.eq("id", filters.id);
    if (filters.employee_id) query = query.eq("employee_id", filters.employee_id);
    if (filters.timeoff_id) query = query.eq("timeoff_id", filters.timeoff_id);
    if (filters.period) query = query.ilike("period", filters.period);
    if (filters.operation) query = query.ilike("operation", filters.operation);

    query = query.order(sortBy, { ascending: order === "asc" });
    if (from !== undefined && to !== undefined) {
        query = query.range(from, to);
    }

    return await query;
};

const findAdjustmentById = async (id) => {
    return await db
        .from("t_timeoff_adjustment")
        .select(`
            *,
            employee:master_employee (id, full_name),
            time_off:master_timeoff (id, name)
        `)
        .eq("id", id)
        .single();
};

const createAdjustment = async (payload) => {
    return await db
        .from("t_timeoff_adjustment")
        .insert(payload)
        .select();
};

const deleteAdjustment = async (id) => {
    return await db
        .from("t_timeoff_adjustment")
        .delete()
        .eq("id", id)
        .select();
};

const updateAdjustment = async (id, payload) => {
    return await db
        .from("t_timeoff_adjustment")
        .update(payload)
        .eq("id", id)
        .select();
};

// === QUOTAS (Employee Time Off) ===

const findQuotas = async ({
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

    if (filters.id) query = query.eq("id", filters.id);
    if (filters.employee_id) query = query.eq("employee_id", filters.employee_id);
    if (filters.timeoff_id) query = query.eq("timeoff_id", filters.timeoff_id);
    if (filters.period) query = query.ilike("period", filters.period);

    query = query.order(sortBy, { ascending: order === "asc" });
    if (from !== undefined && to !== undefined) {
        query = query.range(from, to);
    }

    return await query;
};

const findQuotaById = async (id) => {
    return await db
        .from("master_timeoff_employee")
        .select(`
            *,
            employee:master_employee (id, name:full_name),
            time_off:master_timeoff (id, name)
        `)
        .eq("id", id)
        .single();
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

const createQuota = async (payload) => {
    return await db
        .from("master_timeoff_employee")
        .insert(payload)
        .select();
};

const deleteQuota = async (id) => {
    return await db
        .from("master_timeoff_employee")
        .delete()
        .eq("id", id)
        .select();
};

const updateQuota = async (id, payload) => {
    return await db
        .from("master_timeoff_employee")
        .update(payload)
        .eq("id", id)
        .select();
};

// === SHARED / UTILS ===

const getHolidays = async (start, end) => {
    const nationalQuery = db
        .from("master_holiday")
        .select("date, name, is_national_holiday")
        .eq("is_national_holiday", true)
        .gte("date", start)
        .lte("date", end);

    const recurringQuery = db
        .from("master_holiday")
        .select("date, name, is_national_holiday")
        .eq("is_national_holiday", false);

    const [nationalResult, recurringResult] = await Promise.all([nationalQuery, recurringQuery]);

    const data = [
        ...(nationalResult.data || []),
        ...(recurringResult.data || [])
    ];

    return { data, error: nationalResult.error || recurringResult.error };
};

module.exports = {
    // Requests
    findRequests,
    findRequestById,
    createRequest,
    updateRequest,
    findOverlap,
    // Approvals
    findPendingApprovals,
    // Adjustments
    findAdjustments,
    findAdjustmentById,
    createAdjustment,
    updateAdjustment,
    deleteAdjustment,
    // Quotas
    findQuotas,
    findQuotaById,
    findByEmployeeAndTimeoff,
    createQuota,
    updateQuota,
    deleteQuota,
    // Utils
    getHolidays
};