const db = require("../../../../db");

const findById = async (id) => {
    return await db
        .from("master_afdeling")
        .select("*")
        .eq("id", id)
        .single();
};

const findAll = async ({ from, to, sortBy, order, search }) => {
    let query = db
        .from("master_afdeling")
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

const createAfdeling = async (payload) => {
    return await db
        .from("master_afdeling")
        .insert(payload)
        .select();
};

const deleteAfdeling = async (id, userEmail) => {
    return await db
        .from("master_afdeling")
        .delete()
        .eq("id", id)
        .select()
        .single();
};

const updateAfdeling = async (id, payload) => {
    return await db
        .from("master_afdeling")
        .update(payload)
        .eq("id", id)
        .select();
};

module.exports = {
    findAll,
    findById,
    createAfdeling,
    deleteAfdeling,
    updateAfdeling
};