const { findAll, createHoliday, deleteHoliday } = require("./holiday.repository");

const getAHoliday = async (params) => {
    let {
        page = 1,
        limit = 10,
        sortBy = "created_at",
        order = "desc",
        search = "",
        is_national_holiday,
        date
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

    if (is_national_holiday !== undefined) {
        filters.is_national_holiday =
            is_national_holiday === "true" || is_national_holiday === true;
    }

    if (date) {
        filters.date = date;
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

const createHolidayService = async (body) => {
    const { name, is_national_holiday, date } = body;

    if (!name) {
        throw new Error("Name is required");
    }

    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(name)) {
        throw new Error("Name cannot contain special characters");
    }

    if (typeof is_national_holiday !== "boolean") {
        throw new Error("National holiday must be a boolean");
    }

    if (!date) {
        throw new Error("Date is required");
    }

    const isValidDate = /^\d{4}-\d{2}-\d{2}$/;
    if (!isValidDate.test(date)) {
        throw new Error("Invalid date format (YYYY-MM-DD expected)");
    }

    const { data, error } = await createHoliday({
        name,
        is_national_holiday,
        date
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

const deleteHolidayService = async (id) => {
    if (!id || isNaN(id)) {
        throw new Error("Invalid ID");
    }

    const { data, error } = await deleteHoliday(id);

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

const updateHolidayService = async (id, body) => {
    const { name, is_national_holiday, date } = body;

    const parsedId = parseInt(id);

    if (!parsedId || isNaN(parsedId)) {
        throw new Error("Invalid ID");
    }

    const payload = {};

    if (name !== undefined) {
        if (!name) {
            throw new Error("Name cannot be empty");
        }

        const nameRegex = /^[A-Za-z\s]+$/;
        if (!nameRegex.test(name)) {
            throw new Error("Name cannot contain special characters");
        }
        payload.name = name;
    }

    if (is_national_holiday !== undefined) {
        if (typeof is_national_holiday !== "boolean") {
            throw new Error("National holiday must be a boolean");
        }
        payload.is_national_holiday = is_national_holiday;
    }

    if (date !== undefined) {
        const isValidDate = /^\d{4}-\d{2}-\d{2}$/;
        if (!isValidDate.test(date)) {
            throw new Error("Invalid date format (YYYY-MM-DD expected)");
        }
        payload.date = date;
    }

    if (Object.keys(payload).length === 0) {
        throw new Error("No data provided for update");
    }

    const { data, error } = await updateHoliday(parsedId, payload);

    if (error) {
        throw new Error(error.message);
    }

    if (!data || data.length === 0) {
        const err = new Error("Data not found");
        err.status = 404;
        throw err;
    }

    return data;
};

module.exports = {
    getAHoliday,
    createHolidayService,
    deleteHolidayService,
    updateHolidayService
};