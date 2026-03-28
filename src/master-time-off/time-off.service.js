const { findAll, createTimeOff, deleteTimeOff, updateTimeOff } = require("./time-off.repository");

const getTimeOff = async (params) => {
    let {
        page = 1,
        limit = 10,
        sortBy = "created_at",
        order = "desc",
        search = "",
        timeoff_type
    } = params;

    page = parseInt(page);
    limit = parseInt(limit);

    if (page < 1 || limit < 1) {
        throw new Error("Invalid pagination params");
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // whitelist sorting
    const allowedSort = ["name", "created_at"];
    if (!allowedSort.includes(sortBy)) {
        sortBy = "created_at";
    }

    // filter
    const filters = {};

    if (timeoff_type) {
        filters.timeoff_type = timeoff_type;
    }

    const { data, error, count } = await findAll({
        from,
        to,
        sortBy,
        order,
        search,
        filters
    });

    if (error) {
        throw new Error(error.message);
    }

    return {
        data,
        meta: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit)
        }
    };
};

const createTimeOffService = async (body) => {
    const { name, timeoff_type } = body;

    // Validation
    if (!name) {
        throw new Error("Name is required");
    }

    if (!timeoff_type) {
        throw new Error("Time Off is required");
    }

    const { data, error } = await createTimeOff({ name, timeoff_type });

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

const deleteTimeOffService = async (id) => {
    if (!id || isNaN(id)) {
        throw new Error("Invalid ID");
    }

    const { data, error } = await deleteTimeOff(id);

    if (error) {
        throw new Error(error.message);
    }

    if (!data || data.length === 0) {
        const err = new Error("Data tidak ditemukan");
        err.status = 404;
        throw err;
    }

    return data;
};

const updateTimeOffService = async (id, body) => {
    const parsedId = parseInt(id);
    const { name, timeoff_type } = body;

    // Validasi ID
    if (!parsedId || isNaN(parsedId)) {
        const err = new Error("Invalid ID");
        err.status = 400;
        throw err;
    }

    // Validasi body
    if (!name) {
        const err = new Error("Name is required");
        err.status = 400;
        throw err;
    }

    if (!timeoff_type) {
        const err = new Error("Time Off Type is required");
        err.status = 400;
        throw err;
    }

    const { data, error } = await updateTimeOff(parsedId, { name, timeoff_type });

    if (error) {
        throw new Error(error.message);
    }

    if (!data || data.length === 0) {
        const err = new Error("Data tidak ditemukan");
        err.status = 404;
        throw err;
    }

    return data;
};

module.exports = {
    getTimeOff,
    createTimeOffService,
    deleteTimeOffService,
    updateTimeOffService
};