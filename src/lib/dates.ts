export function isoToLocalDateInput(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Combine the picked YYYY-MM-DD with the original ISO's local time-of-day so
// same-day ordering and timestamps don't get clobbered when only the date moves.
export function dateInputToIso(value: string, originalIso: string): string {
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return originalIso;
  const [y, m, day] = parts as [number, number, number];
  const o = new Date(originalIso);
  const next = new Date(
    y,
    m - 1,
    day,
    o.getHours(),
    o.getMinutes(),
    o.getSeconds(),
    o.getMilliseconds(),
  );
  return next.toISOString();
}
