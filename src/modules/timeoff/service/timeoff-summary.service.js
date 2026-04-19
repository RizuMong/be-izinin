const { findRequests } = require("../repository/timeoff.repository");

const getAllHistoryAdminService = async (params) => {
    let {
        page = 1,
        limit = 10,
        sortBy = "id",
        order = "desc",
        employee_id,
        timeoff_id,
        status,
        start_date,
        end_date
    } = params;

    page = parseInt(page);
    limit = parseInt(limit);

    if (page < 1 || limit < 1) {
        throw new Error("Invalid pagination params");
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const filters = {};
    if (employee_id) filters.employee_id = employee_id;
    if (timeoff_id) filters.timeoff_id = timeoff_id;
    if (status) {
        filters.status = status.split(",").map(s => s.trim().toUpperCase());
    }
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;

    const { data, error, count } = await findRequests({
        from,
        to,
        sortBy,
        order,
        filters
    });

    if (error) throw new Error(error.message);

    return {
        data: data,
        meta: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit)
        }
    };
};

const getUserRequestListService = async (params, userEmail) => {
    let {
        page = 1,
        limit = 10,
        sortBy = "created_at",
        order = "desc",
        status,
        start_date,
        end_date
    } = params;

    page = parseInt(page);
    limit = parseInt(limit);

    if (page < 1 || limit < 1) {
        throw new Error("Invalid pagination params");
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Enforce user email from token
    const filters = {
        created_by_email: userEmail
    };

    if (status) {
        filters.status = status.split(",").map(s => s.trim().toUpperCase());
    }
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;

    const { data, error, count } = await findRequests({
        from,
        to,
        sortBy,
        order,
        filters
    });

    if (error) throw new Error(error.message);

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

module.exports = {
    getAllHistoryAdminService,
    getUserRequestListService
};
