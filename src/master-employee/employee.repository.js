const db = require("../db");

const findAll = async ({
    from,
    to,
    sortBy,
    order,
    filters = {}
}) => {
    let query = db
        .from("master_employee")
        .select("*", { count: "exact" });

    // filters
    if (filters.full_name) {
        query = query.ilike("full_name", `%${filters.full_name}%`);
    }

    if (filters.id) {
        query = query.eq("id", filters.id);
    }

    if (filters.site_id) {
        query = query.eq("site_id", filters.site_id);
    }

    if (filters.afdeling_id) {
        query = query.eq("afdeling_id", filters.afdeling_id);
    }

    if (filters.npk) {
        query = query.ilike("npk", filters.npk);
    }

    if (filters.job_position_id) {
        query = query.eq("job_position_id", filters.job_position_id);
    }

    if (filters.tmk) {
        query = query.eq("tmk", filters.tmk);
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

const findByNpk = async (npk) => {
    return await db
        .from("master_employee")
        .select("id")
        .eq("npk", npk)
        .maybeSingle();
};

const createEmployee = async (payload) => {
    return await db
        .from("master_employee")
        .insert(payload)
        .select();
};

const deleteEmployee = async (id) => {
    return await db
        .from("master_employee")
        .delete()
        .eq("id", id)
        .select(); // biar tahu data kehapus
};

const updateEmployee = async (id, payload) => {
    return await db
        .from("master_employee")
        .update(payload)
        .eq("id", id)
        .select();
};

module.exports = {
    findAll,
    findById,
    findByNpk,
    createEmployee,
    deleteEmployee,
    updateEmployee
};