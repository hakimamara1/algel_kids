// Calendar days in Algeria time (UTC+1 all year, no summer time)
const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const algeriaDay = (date = new Date()) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Algiers', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);

// "2026-09-17" -> the moment that day starts in Algeria
const dayStart = (day) => new Date(`${day}T00:00:00+01:00`);

const addDays = (day, count) => algeriaDay(new Date(dayStart(day).getTime() + count * 24 * 60 * 60 * 1000));

module.exports = { DAY_PATTERN, algeriaDay, dayStart, addDays };
