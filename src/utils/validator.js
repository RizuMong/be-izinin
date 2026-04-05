const { findDuplicate } = require("../repositories/base.repository");

// dynamic duplicate validator
const validateDuplicate = async ({
    table,
    field,
    value,
    label,
    excludeId = null
}) => {
    const { data } = await findDuplicate(table, field, value);

    if (data && data.id !== excludeId) {
        const err = new Error(`${label} already exists`);
        err.status = 400;
        throw err;
    }
};

module.exports = {
    validateDuplicate
};