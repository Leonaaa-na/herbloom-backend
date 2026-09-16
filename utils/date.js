const toDateString = (d) => new Date(d).toISOString().slice(0, 10);

// addDays("2026-09-01", 28) → "2026-09-29"   (negative numbers go backwards)
const addDays = (date, days) => {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateString(d);
};

// diffDays("2026-09-01", "2026-09-29") → 28
const diffDays = (from, to) => Math.round((new Date(to) - new Date(from)) / 86400000);

const today = () => toDateString(new Date());

module.exports = { toDateString, addDays, diffDays, today };