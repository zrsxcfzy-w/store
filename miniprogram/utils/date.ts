export type DeliveryPlatform = "京东" | "淘宝" | "拼多多" | "线下超市" | "其他平台";

export const PLATFORM_DELIVERY_DAYS: Record<DeliveryPlatform, number> = {
  "京东": 2,
  "淘宝": 3,
  "拼多多": 3,
  "线下超市": 0,
  "其他平台": 3
};

export function todayIso(): string {
  const now = new Date();
  return toIsoDate(now);
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatChineseDate(isoDate: string): string {
  if (!isoDate) return "暂无记录";
  const [year, month, day] = isoDate.split("-");
  return `${year}年${month}月${day}日`;
}

export function formatDotDate(isoDate: string): string {
  if (!isoDate) return "暂无记录";
  const [year, month, day] = normalizeIsoDate(isoDate).split("-");
  return `${year}.${month}.${day}`;
}

export function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(`${normalizeIsoDate(startIso)}T00:00:00`);
  const end = new Date(`${normalizeIsoDate(endIso)}T00:00:00`);
  const diff = end.getTime() - start.getTime();
  return Math.max(0, Math.round(diff / 86400000));
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${normalizeIsoDate(isoDate)}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function compareIsoDate(a: string, b: string): number {
  const normalizedA = normalizeIsoDate(a).replace(/-/g, "");
  const normalizedB = normalizeIsoDate(b).replace(/-/g, "");
  return normalizedA.localeCompare(normalizedB);
}

export function daysUntil(isoDate: string): number {
  return daysBetween(todayIso(), isoDate);
}

export function estimateText(isoDate: string): string {
  if (!isoDate || compareIsoDate(isoDate, todayIso()) <= 0) return "已到期";
  return `还需${daysUntil(isoDate)}天`;
}

export function normalizeIsoDate(dateText: string): string {
  const parts = String(dateText || "")
    .replace(/[./年月]/g, "-")
    .replace(/日/g, "")
    .split("-")
    .filter(Boolean);
  const [year = "0000", month = "00", day = "00"] = parts;
  return `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}
