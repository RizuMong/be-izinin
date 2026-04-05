const {
    getAllUsers,
    getUserFromToken
} = require("./user.repository");

const getUsersService = async () => {
    const { data, error } = await getAllUsers();

    if (error) {
        throw new Error(error.message);
    }

    return data.users;
};

const getMeService = async (token) => {
    if (!token) {
        const err = new Error("Authorization token is required");
        err.status = 401;
        throw err;
    }

    const { data, error } = await getUserFromToken(token);

    if (error || !data.user) {
        const err = new Error("Invalid or expired token");
        err.status = 401;
        throw err;
    }

    return data.user;
};

module.exports = {
    getUsersService,
    getMeService
};