const { findPendingApprovals } = require("./approval.repository");

const getApprovalTimeOffRequests = async (params, userEmail) => {
    let {
        page = 1,
        limit = 10,
        sortBy = "created_at",
        order = "desc"
    } = params;

    page = parseInt(page);
    limit = parseInt(limit);

    if (page < 1 || limit < 1) {
        throw new Error("Invalid pagination params");
    }

    const { data: rawData, error } = await findPendingApprovals();

    if (error) {
        throw new Error(error.message);
    }

    const filteredData = rawData.filter((request) => {
        if (!Array.isArray(request.approval_logs)) return false;

        const firstPending = request.approval_logs.find(
            (log) => log.status === "PENDING"
        );

        if (!firstPending) return false;

        return firstPending.email === userEmail;
    });

    const sortedData = filteredData.sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (valA < valB) return order === "asc" ? -1 : 1;
        if (valA > valB) return order === "asc" ? 1 : -1;
        return 0;
    });

    // Pagination
    const total = sortedData.length;
    const from = (page - 1) * limit;
    const resultData = sortedData.slice(from, from + limit);

    return {
        data: resultData,
        meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

module.exports = {
    getApprovalTimeOffRequests
};