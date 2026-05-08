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
  const [year, month, day] = isoDate.split("-");
  return `${year}.${month}.${day}`;
}

export function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  const diff = end.getTime() - start.getTime();
  return Math.max(0, Math.round(diff / 86400000));
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function compareIsoDate(a: string, b: string): number {
  return new Date(`${a}T00:00:00`).getTime() - new Date(`${b}T00:00:00`).getTime();
}

export function daysUntil(isoDate: string): number {
  return daysBetween(todayIso(), isoDate);
}

export function estimateText(isoDate: string): string {
  if (!isoDate || compareIsoDate(isoDate, todayIso()) <= 0) return "已到期";
  return `还需${daysUntil(isoDate)}天`;
}
