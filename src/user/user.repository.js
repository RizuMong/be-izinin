const db = require("../db");


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