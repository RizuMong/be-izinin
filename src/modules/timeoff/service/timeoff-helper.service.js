const { getHolidays } = require("../repository/timeoff.repository");
const { DAY_NAME_TO_INDEX } = require("../../../shared/constants/timeoff.constants");

const buildHolidayLookup = (holidays) => {
    const nationalSet = new Set();
    const recurringDays = new Set();

    for (const h of holidays) {
        if (h.is_national_holiday) {
            const dateStr = typeof h.date === "string"
                ? h.date.split("T")[0]
                : new Date(h.date).toISOString().split("T")[0];
            nationalSet.add(dateStr);
        } else {
            const idx = DAY_NAME_TO_INDEX[h.name?.toLowerCase()];
            if (idx !== undefined) {
                recurringDays.add(idx);
            }
        }
    }

    return { nationalSet, recurringDays };
};

const calculateDaysByPeriod = async (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const { data: holidays } = await getHolidays(start, end);
    const { nationalSet, recurringDays } = buildHolidayLookup(holidays);

    const periodMap = {};

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        const dayIndex = d.getDay();
        const year = d.getFullYear();

        const isNationalHoliday = nationalSet.has(dateStr);
        const isRecurringHoliday = recurringDays.has(dayIndex);

        if (!isNationalHoliday && !isRecurringHoliday) {
            periodMap[year] = (periodMap[year] || 0) + 1;
        }
    }

    return Object.entries(periodMap).map(([year, days]) => ({
        year: parseInt(year),
        days
    }));
};

module.exports = {
    calculateDaysByPeriod
};
