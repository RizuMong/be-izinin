const db = require("../db");

const findAll = async ({ from, to, sortBy, order, search }) => {
    let query = db
        .from("master_job_position")
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

const createJobPosition = async (payload) => {
    return await db
        .from("master_job_position")
        .insert(payload)
        .select();
};

const deleteJobPosition = async (id) => {
    return await db
        .from("master_job_position")
        .delete()
        .eq("id", id)
        .select(); // biar tahu data kehapus
};

const updateJobPosition = async (id, payload) => {
    return await db
        .from("master_job_position")
        .update(payload)
        .eq("id", id)
        .select();
};

module.exports = {
    findAll,
    createJobPosition,
    deleteJobPosition,
    updateJobPosition
};