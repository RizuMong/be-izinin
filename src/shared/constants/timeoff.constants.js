const STATUS = {
    DRAFT: "DRAFT",
    PENDING: "PENDING",
    SUBMITTED: "SUBMITTED",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    CANCELLED: "CANCELLED"
};

const DAY_NAME_TO_INDEX = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
};

module.exports = {
    STATUS,
    DAY_NAME_TO_INDEX
};
