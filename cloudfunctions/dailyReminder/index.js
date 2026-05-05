const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

function parseDate(date) {
  return new Date(`${date}T00:00:00`);
}

function daysBetween(start, end) {
  const diff = parseDate(end).getTime() - parseDate(start).getTime();
  return Math.max(0, Math.round(diff / 86400000));
}

function addDays(date, days) {
  const result = parseDate(date);
  result.setDate(result.getDate() + days);
  const y = result.getFullYear();
  const m = `${result.getMonth() + 1}`.padStart(2, "0");
  const d = `${result.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, "0");
  const d = `${now.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function compareDate(a, b) {
  return parseDate(a).getTime() - parseDate(b).getTime();
}

function estimateText(nextDate) {
  if (!nextDate || compareDate(nextDate, todayIso()) <= 0) return "已到期";
  return `还需${daysBetween(todayIso(), nextDate)}天`;
}

function itemView(item) {
  const deliveryDays = {
    "京东": 2,
    "淘宝": 3,
    "拼多多": 3,
    "线下超市": 0,
    "其他平台": 3
  };
  const bills = [...(item.bills || [])].sort((a, b) => compareDate(a.date, b.date));
  const previousBill = bills.length >= 2 ? bills[bills.length - 2] : null;
  const lastBill = bills[bills.length - 1];
  const cycleDays = previousBill && lastBill ? Math.max(1, daysBetween(previousBill.date, lastBill.date)) : 30;
  const useUpDate = lastBill ? addDays(lastBill.date, cycleDays) : addDays(todayIso(), 30);
  const nextSuggestedDate = addDays(useUpDate, -(deliveryDays[lastBill?.platform] ?? 3));
  const stock = Math.max(0, bills.reduce((sum, bill) => sum + Number(bill.quantity || 0), 0) - Number(item.manualConsumption || 0));
  return {
    name: item.name,
    stock,
    nextSuggestedDate,
    nextSuggestedText: estimateText(nextSuggestedDate)
  };
}

exports.main = async (event) => {
  const templateId = event.templateId;
  const { OPENID } = cloud.getWXContext();
  const result = await db.collection("items").where({ openid: OPENID }).get();
  const list = result.data
    .map(itemView)
    .filter((item) => item.stock <= 1 || item.nextSuggestedText === "已到期" || daysBetween(todayIso(), item.nextSuggestedDate) <= 3)
    .sort((a, b) => {
      if (a.stock !== b.stock) return a.stock - b.stock;
      return compareDate(a.nextSuggestedDate, b.nextSuggestedDate);
    });

  const text = list
    .map((item, index) => `(${index + 1}) ${item.name} 剩余库存: ${item.stock} 预计购买时间: ${item.nextSuggestedText}`)
    .join("\n");

  if (!templateId || !list.length) {
    return { text, count: list.length };
  }

  await cloud.openapi.subscribeMessage.send({
    touser: OPENID,
    templateId,
    page: "pages/index/index",
    data: {
      thing1: { value: list[0].name.slice(0, 20) },
      thing2: { value: text.slice(0, 20) }
    }
  });

  return { text, count: list.length };
};
