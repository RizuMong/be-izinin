const db = require("../../../../db");

const findById = async (id) => {
    return await db
        .from("master_holiday")
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
        .from("master_holiday")
        .select("*", { count: "exact" });

    //  Search
    if (search) {
        query = query.ilike("name", `%${search}%`);
    }

    // filters
    if (filters.is_national_holiday !== undefined) {
        query = query.eq("is_national_holiday", filters.is_national_holiday);
    }

    if (filters.date) {
        query = query.eq("date", filters.date);
    }

    // Sorting
    query = query.order(sortBy, { ascending: order === "asc" });

    // Pagination
    query = query.range(from, to);

    return await query;
};

const createHoliday = async (payload) => {
    return await db
        .from("master_holiday")
        .insert(payload)
        .select();
};

const deleteHoliday = async (id) => {
    return await db
        .from("master_holiday")
        .delete()
        .eq("id", id)
        .select(); // biar tahu data kehapus
};

const updateHoliday = async (id, payload) => {
    return await db
        .from("master_holiday")
        .update(payload)
        .eq("id", id)
        .select();
};

module.exports = {
    findAll,
    findById,
    createHoliday,
    deleteHoliday,
    updateHoliday
};