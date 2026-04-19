const db = require("../../../db");

const findById = async (id) => {
    return await db
        .from("users")
        .select(`
            *,
            employee:master_employee(*)
        `)
        .eq("id", id)
        .single();
};


// get all users
const getAllUsers = async () => {
    return await db.auth.admin.listUsers();
};

// get user from token
const getUserFromToken = async (token) => {
    return await db.auth.getUser(token);
};

module.exports = {
    getAllUsers,
    getUserFromToken
};