const { findRequestById } = require("../repository/timeoff.repository");

const getTimeOffRequestDetailService = async (id) => {
    const { data, error } = await findRequestById(id);

    if (error || !data) {
        const err = new Error("Data tidak ditemukan");
        err.status = 404;
        throw err;
    }

    return data;
};

module.exports = {
    getTimeOffRequestDetailService
};
