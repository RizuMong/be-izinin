const { findQuotas, createQuota, updateQuota, deleteQuota } = require("../repository/timeoff.repository");
const employeeRepository = require("../../master/employee/repository/employee.repository");
const timeoffTypeRepository = require("../../master/timeoff-type/repository/time-off.repository");

const validateFK = async (repo, id, label) => {
    const { data } = await repo.findById(id);
    if (!data) {
        const err = new Error(`${label} not found`);
        err.status = 404;
        throw err;
    }
};

const getQuotas = async (params) => {
    let {
        page = 1,
        limit = 10,
        sortBy = "created_at",
        order = "desc",
        employee_id,
        timeoff_id,
        period
    } = params;

    page = parseInt(page);
    limit = parseInt(limit);

    if (page < 1 || limit < 1) {
        throw new Error("Invalid pagination params");
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const filters = {};
    if (employee_id) filters.employee_id = parseInt(employee_id);
    if (timeoff_id) filters.timeoff_id = parseInt(timeoff_id);
    if (period) filters.period = period;

    const { data, error, count } = await findQuotas({
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

const createQuotaService = async (body) => {
    const { employee_id, timeoff_id, period, total_quota, remaining_balance, used_quota } = body;

    if (!employee_id || !timeoff_id || !period) {
        throw new Error("Incomplete data");
    }

    // FK Validation
    await validateFK(employeeRepository, employee_id, "Employee");
    await validateFK(timeoffTypeRepository, timeoff_id, "Time Off Type");

    const { data, error } = await createQuota({
        employee_id,
        timeoff_id,
        period,
        total_quota,
        remaining_balance,
        used_quota
    });

    if (error) throw new Error(error.message);
    return data;
};

const updateQuotaService = async (id, body) => {
    const { data, error } = await updateQuota(id, body);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("Data not found");

    return data;
};

const deleteQuotaService = async (id) => {
    const { data, error } = await deleteQuota(id);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error("Data not found");

    return data;
};

module.exports = {
    getQuotas,
    createQuotaService,
    updateQuotaService,
    deleteQuotaService
};
