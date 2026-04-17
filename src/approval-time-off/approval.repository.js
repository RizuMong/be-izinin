const db = require("../db");

const findPendingApprovals = async (email) => {
    return await db
        .from("t_request_timeoff")
        .select(`
            *,
            employee:master_employee (
                id,
                name:full_name
            ),
            time_off:master_timeoff (
                id,
                name
            )
        `)
        .eq("status", "SUBMITTED");
};

module.exports = {
    findPendingApprovals
};
