const db = require("../../db");

const findDuplicate = async (table, field, value) => {
    return await db
        .from(table)
        .select("id")
        .ilike(field, value)
        .maybeSingle();
};

module.exports = {
    findDuplicate
};