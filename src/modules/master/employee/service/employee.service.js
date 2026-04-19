const { findAll, findById, findByNpk, createEmployee, deleteEmployee, updateEmployee } = require("../repository/employee.repository");
const siteRepository = require("../../site/repository/site.repository");
const afdelingRepository = require("../../afdeling/repository/afdeling.repository");
const positionRepository = require("../../position/repository/job-position.repository");

const validateFK = async (repo, id, label) => {
    const { data } = await repo.findById(id);

    if (!data) {
        const err = new Error(`${label} not found`);
        err.status = 404;
        throw err;
    }
};

const getAEmployee = async (params) => {
    let {
        page = 1,
        limit = 10,
        sortBy = "created_at",
        order = "desc",
        id,
        site_id,
        job_position_id,
        afdeling_id,
        npk,
        full_name,
        tmk
    } = params;

    page = parseInt(page);
    limit = parseInt(limit);

    if (page < 1 || limit < 1) {
        throw new Error("Invalid pagination params");
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // whitelist sorting
    const allowedSort = ["full_name", "created_at"];
    if (!allowedSort.includes(sortBy)) {
        sortBy = "created_at";
    }

    // filter
    const filters = {};

    if (id) {
        filters.id = id;
    }

    if (site_id) {
        filters.site_id = site_id;
    }

    if (job_position_id) {
        filters.job_position_id = job_position_id;
    }

    if (afdeling_id) {
        filters.afdeling_id = afdeling_id;
    }

    if (npk) {
        filters.npk = npk;
    }

    if (full_name) {
        filters.full_name = full_name;
    }

    if (tmk) {
        filters.tmk = tmk;
    }

    const { data, error, count } = await findAll({
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

const createEmployeeService = async (body) => {
    const {
        site_id,
        afdeling_id,
        job_position_id,
        npk,
        full_name,
        tmk
    } = body;

    if (!site_id) {
        throw new Error("Site is required");
    }

    if (!afdeling_id) {
        throw new Error("Afdeling is required");
    }

    if (!job_position_id) {
        throw new Error("Job Position is required");
    }

    if (!npk) {
        throw new Error("NPK is required");
    }

    const npkRegex = /^[A-Za-z0-9]+$/;
    if (!npkRegex.test(npk)) {
        throw new Error("NPK cannot contain special characters");
    }

    if (!full_name) {
        throw new Error("Full Name is required");
    }

    const nameRegex = /^[A-Za-z0-9\s]+$/;
    if (!nameRegex.test(full_name)) {
        throw new Error("Full Name cannot contain special characters");
    }

    if (!tmk) {
        throw new Error("Tahun Masuk Kerja is required");
    }

    const isValidDate = /^\d{4}-\d{2}-\d{2}$/;
    if (!isValidDate.test(tmk)) {
        throw new Error("Invalid date format (YYYY-MM-DD expected)");
    }

    const { data: existing } = await findByNpk(npk);

    if (existing) {
        const err = new Error("NPK already exists");
        err.status = 400;
        throw err;
    }

    // FK validation
    await validateFK(siteRepository, site_id, "Site");
    await validateFK(afdelingRepository, afdeling_id, "Afdeling");
    await validateFK(positionRepository, job_position_id, "Job Position");

    const { data, error } = await createEmployee({
        site_id,
        afdeling_id,
        job_position_id,
        npk,
        full_name,
        tmk
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

const deleteEmployeeService = async (id) => {
    if (!id || isNaN(id)) {
        throw new Error("Invalid ID");
    }

    const { data, error } = await deleteEmployee(id);

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

const updateEmployeeService = async (id, body) => {
    const parsedId = parseInt(id);

    if (!parsedId || isNaN(parsedId)) {
        throw new Error("Invalid ID");
    }

    const {
        site_id,
        afdeling_id,
        job_position_id,
        npk,
        full_name,
        tmk
    } = body;

    const payload = {};

    if (site_id !== undefined) {
        if (!site_id) {
            throw new Error("Site is required");
        }

        await validateFK(siteRepository, site_id, "Site");

        payload.site_id = site_id;
    }

    if (afdeling_id !== undefined) {
        if (!afdeling_id) {
            throw new Error("Afdeling is required");
        }

        await validateFK(afdelingRepository, afdeling_id, "Afdeling");

        payload.afdeling_id = afdeling_id;
    }

    if (job_position_id !== undefined) {
        if (!job_position_id) {
            throw new Error("Job Position is required");
        }

        await validateFK(positionRepository, job_position_id, "Job Position");

        payload.job_position_id = job_position_id;
    }

    if (npk !== undefined) {
        if (!npk) {
            throw new Error("NPK is required");
        }

        const npkRegex = /^[A-Za-z0-9]+$/;
        if (!npkRegex.test(npk)) {
            throw new Error("NPK cannot contain special characters");
        }

        payload.npk = npk;
    }

    if (full_name !== undefined) {
        if (!full_name) {
            throw new Error("Full Name is required");
        }

        const nameRegex = /^[A-Za-z0-9\s]+$/;
        if (!nameRegex.test(full_name)) {
            throw new Error("Full Name cannot contain special characters");
        }

        payload.full_name = full_name;
    }

    if (tmk !== undefined) {
        if (!tmk) {
            throw new Error("Tahun Masuk Kerja is required");
        }

        const isValidDate = /^\d{4}-\d{2}-\d{2}$/;
        if (!isValidDate.test(tmk)) {
            throw new Error("Invalid date format (YYYY-MM-DD expected)");
        }

        payload.tmk = tmk;
    }

    if (Object.keys(payload).length === 0) {
        throw new Error("No data provided for update");
    }


    const { data, error } = await updateEmployee(parsedId, payload);

    if (error) {
        throw new Error(error.message);
    }

    if (!data || data.length === 0) {
        const err = new Error("Employee not found");
        err.status = 404;
        throw err;
    }

    return data;
};

module.exports = {
    getAEmployee,
    createEmployeeService,
    deleteEmployeeService,
    updateEmployeeService
};