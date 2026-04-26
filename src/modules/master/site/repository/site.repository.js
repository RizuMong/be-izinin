const db = require("../../../../db");

const findById = async (id) => {
    return await db
        .from("master_site")
        .select("*")
        .eq("id", id)
        .single();
};

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
        .insert({
            ...payload,
            created_by_email: payload.created_by_email,
            updated_by_email: payload.updated_by_email
        })
        .select();
};

const deleteSite = async (id, userEmail) => {
    return await db
        .from("master_site")
        .delete()
        .eq("id", id)
        .select()
        .single();
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
    findById,
    createSite,
    deleteSite,
    updateSite
};