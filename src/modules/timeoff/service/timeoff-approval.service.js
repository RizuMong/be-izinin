const { findPendingApprovals } = require("../repository/timeoff.repository");
const { STATUS } = require("../../../shared/constants/timeoff.constants");

const getApprovalTimeOffRequests = async (params, userEmail) => {
    let {
        page = 1,
        limit = 10,
        sortBy = "created_at",
        order = "desc"
    } = params;

    page = parseInt(page);
    limit = parseInt(limit);

    const { data, error } = await findPendingApprovals();

    if (error) {
        throw new Error(error.message);
    }

    // Sequential Filter: Only show to current pending approver
    const filteredData = data.filter(record => {
        const logs = record.approval_logs || [];
        const currentApprover = logs.find(log => log.status === STATUS.PENDING);
        return currentApprover && currentApprover.email === userEmail;
    });

    // Manual Sort and Pagination on filtered results
    const sortedData = filteredData.sort((a, b) => {
        const valA = a[sortBy];
        const valB = b[sortBy];
        if (order === "asc") return valA > valB ? 1 : -1;
        return valA < valB ? 1 : -1;
    });

    const total = sortedData.length;
    const start = (page - 1) * limit;
    const paginatedData = sortedData.slice(start, start + limit);

    return {
        data: paginatedData,
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
