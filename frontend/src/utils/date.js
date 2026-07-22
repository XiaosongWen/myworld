export function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  // If it's already a Date object, return it
  if (dateStr instanceof Date) return dateStr;
  
  // Format is expected to be YYYY-MM-DD
  const parts = String(dateStr).split("T")[0].split("-");
  if (parts.length !== 3) {
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day);
}

export function formatLocalDateShort(dateStr) {
  const date = parseLocalDate(dateStr);
  if (!date) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatLocalDateLong(dateStr) {
  const date = parseLocalDate(dateStr);
  if (!date) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
