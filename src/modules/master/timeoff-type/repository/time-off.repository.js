const db = require("../../../../db");

const findById = async (id) => {
    return await db
        .from("master_timeoff")
        .select("*")
        .eq("id", id)
        .single();
};

const findAll = async ({
    from,
    to,
    sortBy,
    order,
    search,
    filters = {}
}) => {
    let query = db
        .from("master_timeoff")
        .select("*", { count: "exact" });

    //  Search
    if (search) {
        query = query.ilike("name", `%${search}%`);
    }

    // filters
    if (filters.timeoff_type) {
        query = query.eq("timeoff_type", filters.timeoff_type);
    }

    // Sorting
    query = query.order(sortBy, { ascending: order === "asc" });

    // Pagination
    query = query.range(from, to);

    return await query;
};

const createTimeOff = async (payload) => {
    return await db
        .from("master_timeoff")
        .insert(payload)
        .select();
};

const deleteTimeOff = async (id, userEmail) => {
    return await db
        .from("master_time_off")
        .delete()
        .eq("id", id)
        .select()
        .single();
};

const updateTimeOff = async (id, payload) => {
    return await db
        .from("master_timeoff")
        .update(payload)
        .eq("id", id)
        .select();
};

module.exports = {
    findAll,
    findById,
    createTimeOff,
    deleteTimeOff,
    updateTimeOff
};