const safeJson = (obj) => {
    try {
        return JSON.parse(JSON.stringify(obj));
    } catch (err) {
        const error = new Error("Invalid JSON structure");
        error.status = 400;
        throw error;
    }
};

module.exports = {
    safeJson
};