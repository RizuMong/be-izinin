const db = require("../db");

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

const deleteTimeOff = async (id) => {
    return await db
        .from("master_timeoff")
        .delete()
        .eq("id", id)
        .select(); // biar tahu data kehapus
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
    createTimeOff,
    deleteTimeOff,
    updateTimeOff
};