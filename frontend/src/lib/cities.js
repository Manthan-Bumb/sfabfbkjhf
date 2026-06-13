// Title-case a city: "new delhi" → "New Delhi", "MUMBAI " → "Mumbai"
export function normalizeCity(s) {
  if (!s) return "";
  return s.trim()
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.split("-").map(p => p ? p[0].toUpperCase() + p.slice(1) : p).join("-"))
    .join(" ");
}
