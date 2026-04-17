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

    const { data: rawData, error } = await findPendingApprovals(userEmail);

    if (error) {
        throw new Error(error.message);
    }

    // Sequential logic: Show request only if user is the FIRST pending approver
    let filteredData = rawData.filter(request => {
        if (!Array.isArray(request.approval_logs)) return false;
        
        // Find the first pending approver in the logs
        const firstPending = request.approval_logs.find(a => a.status === "PENDING");
        
        // If the first pending approver is the current user, then show it
        return firstPending && firstPending.email === userEmail;
    });

    // Sorting
    filteredData.sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (valA < valB) return order === "asc" ? -1 : 1;
        if (valA > valB) return order === "asc" ? 1 : -1;
        return 0;
    });

    const total = filteredData.length;
    const from = (page - 1) * limit;
    const resultData = filteredData.slice(from, from + limit);

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
