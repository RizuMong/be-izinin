const db = require("../db");

const findAll = async ({ from, to, sortBy, order, search }) => {
    let query = db
        .from("master_site")
        .select("*", { count: "exact" });

    // Search
    if (search) {
        query = query.ilike("name", `%${search}%`);
    };

    // Sorting
    query = query.order(sortBy, { ascending: order === "asc" });

    //  Pagination
    query = query.range(from, to);

    return await query;
};

const createSite = async (payload) => {
    return await db
        .from("master_site")
        .insert(payload)
        .select();
};

const deleteSite = async (id) => {
    return await db
        .from("master_site")
        .delete()
        .eq("id", id)
        .select(); // biar tahu data kehapus
};

const updateSite = async (id, payload) => {
    return await db
        .from("master_site")
        .update(payload)
        .eq("id", id)
        .select();
};

module.exports = {
    findAll,
    createSite,
    deleteSite,
    updateSite
};