const { findRequests } = require("../repository/timeoff.repository");

const getAllTimeOffRequestService = async (params, user) => {
    let {
        page = 1,
        limit = 10,
        sortBy = "created_at",
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

    const allowedSort = ["created_at", "start_date", "end_date", "status"];

    if (!allowedSort.includes(sortBy)) {
        sortBy = "created_at";
    }

    const filters = {};

    if (user && user.email) {
        filters.created_by_email = user.email;
    }

    if (employee_id) filters.employee_id = employee_id;
    if (timeoff_id) filters.timeoff_id = timeoff_id;

    if (status) {
        filters.status = status
            .split(",")
            .map(s => s.trim().toUpperCase());
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

module.exports = {
    getAllTimeOffRequestService
};
