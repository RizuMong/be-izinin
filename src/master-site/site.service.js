const { findAll, createSite, deleteSite, updateSite } = require("./site.repository");
const { validateDuplicate } = require("../utils/validator");

const getSite = async (params) => {
    let {
        page = 1,
        limit = 10,
        sortBy = "created_at",
        order = "desc",
        search = ""
    } = params;

    page = parseInt(page);
    limit = parseInt(limit);

    if (page < 1 || limit < 1) {
        throw new Error("Invalid pagination params");
    };

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // whitelist sorting
    const allowedSort = ["name", "created_at"];
    if (!allowedSort.includes(sortBy)) {
        sortBy = "created_at";
    }

    const { data, error, count } = await findAll({
        from,
        to,
        sortBy,
        order,
        search
    });

    if (error) {
        throw new Error(error.message);
    };

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

const createSiteService = async (body) => {
    const { name } = body;

    // Validation
    if (!name) {
        throw new Error("Name is required");
    }

    const nameRegex = /^[A-Za-z0-9\s]+$/;
    if (!nameRegex.test(name)) {
        throw new Error("Name cannot contain special characters");
    }

    await validateDuplicate({
        table: "master_site",
        field: "name",
        value: name,
        label: "Name"
    });

    const { data, error } = await createSite({ name });

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

const deleteSiteService = async (id) => {
    if (!id || isNaN(id)) {
        throw new Error("Invalid ID");
    }

    const { data, error } = await deleteSite(id);

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

const updateSiteService = async (id, body) => {
    const parsedId = parseInt(id);
    const name = body.name;

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

    const nameRegex = /^[A-Za-z0-9\s]+$/;
    if (!nameRegex.test(name)) {
        throw new Error("Name cannot contain special characters");
    }

    await validateDuplicate({
        table: "master_site",
        field: "name",
        value: name,
        label: "Name",
        excludeId: parsedId
    });

    const { data, error } = await updateSite(parsedId, { name });

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
    getSite,
    createSiteService,
    deleteSiteService,
    updateSiteService
};