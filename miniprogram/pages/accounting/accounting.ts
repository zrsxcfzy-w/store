import { InventoryItem, addBill, currentHouse, getAllBillViews } from "../../services/store";
import { DeliveryPlatform, compareIsoDate, formatDotDate, todayIso } from "../../utils/date";

type CalendarMode = "day" | "week" | "month" | "year";

type CalendarCell = {
  key: string;
  label: string;
  amountText: string;
  amountClass: string;
  cellClass: string;
};

const platforms: DeliveryPlatform[] = ["京东", "淘宝", "拼多多", "线下超市", "其他平台"];
const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

function pad(value: number): string {
  return `${value}`.padStart(2, "0");
}

function dateFromIso(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00`);
}

function isoFromDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isoFromParts(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfMondayWeek(date: Date): Date {
  const next = new Date(date);
  const day = next.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + offset);
  return next;
}

function parseMonthValue(value: string): { year: number; month: number } {
  const [year, month] = String(value || "").split("-").map(Number);
  return { year, month };
}

function needsPlatformDetail(platform: DeliveryPlatform): boolean {
  return platform === "线下超市" || platform === "其他平台";
}

function expenseText(amount: number): string {
  return amount > 0 ? `-${amount.toFixed(2)}` : "";
}

function amountClass(amount: number): string {
  return amount > 0 ? "spent-amount" : "empty-amount";
}

Page({
  data: {
    viewMode: "day" as CalendarMode,
    weekdays,
    selectedYear: new Date().getFullYear(),
    selectedMonth: new Date().getMonth() + 1,
    selectedMonthValue: "",
    selectedYearValue: "",
    monthTitle: "",
    yearTitle: "",
    canGoPrevious: true,
    canGoNext: false,
    dayCells: [] as CalendarCell[],
    weekCells: [] as CalendarCell[],
    monthCells: [] as CalendarCell[],
    yearCells: [] as CalendarCell[],
    items: [] as InventoryItem[],
    itemIndex: 0,
    selectedItemName: "",
    platforms,
    platformIndex: 0,
    recordModalVisible: false,
    form: {
      date: todayIso(),
      platform: "京东" as DeliveryPlatform,
      platformDetail: "",
      price: "",
      quantity: "1"
    },
    formDateText: formatDotDate(todayIso()),
    requiresPlatformDetail: false
  },

  onLoad() {
    const today = dateFromIso(todayIso());
    this.setData({
      selectedYear: today.getFullYear(),
      selectedMonth: today.getMonth() + 1
    });
  },

  onShow() {
    const house = currentHouse();
    const today = todayIso();
    const itemIndex = Math.min(this.data.itemIndex, Math.max(house.items.length - 1, 0));
    if (compareIsoDate(this.data.form.date, today) > 0) {
      this.setData({
        "form.date": today,
        formDateText: formatDotDate(today)
      });
    }
    this.setData({
      items: house.items,
      itemIndex,
      selectedItemName: house.items[itemIndex]?.name || ""
    });
    this.refreshCalendar();
  },

  refreshCalendar() {
    const selectedYear = Number(this.data.selectedYear);
    const selectedMonth = Number(this.data.selectedMonth);
    this.setData({
      selectedMonthValue: `${selectedYear}-${pad(selectedMonth)}`,
      selectedYearValue: `${selectedYear}`,
      monthTitle: `${selectedYear}年 ${selectedMonth}月`,
      yearTitle: `${selectedYear}年`,
      canGoPrevious: this.canGoPrevious(),
      canGoNext: this.canGoNext(),
      dayCells: this.buildDayCells(),
      weekCells: this.buildWeekCells(),
      monthCells: this.buildMonthCells(),
      yearCells: this.buildYearCells()
    });
  },

  amountByDate(): Record<string, number> {
    const map: Record<string, number> = {};
    getAllBillViews().forEach((bill) => {
      const amount = Number(bill.price || 0) * Number(bill.quantity || 0);
      map[bill.date] = Number(map[bill.date] || 0) + amount;
    });
    return map;
  },

  sumBetween(start: Date, end: Date, amountMap: Record<string, number>): number {
    let total = 0;
    for (let cursor = new Date(start); cursor.getTime() <= end.getTime(); cursor = addDays(cursor, 1)) {
      total += Number(amountMap[isoFromDate(cursor)] || 0);
    }
    return total;
  },

  sumMonth(year: number, month: number, amountMap: Record<string, number>): number {
    const days = daysInMonth(year, month);
    return this.sumBetween(new Date(year, month - 1, 1), new Date(year, month - 1, days), amountMap);
  },

  sumYear(year: number, amountMap: Record<string, number>): number {
    return Object.keys(amountMap).reduce((sum, date) => {
      return date.startsWith(`${year}-`) ? sum + Number(amountMap[date] || 0) : sum;
    }, 0);
  },

  buildDayCells(): CalendarCell[] {
    const amountMap = this.amountByDate();
    const year = Number(this.data.selectedYear);
    const month = Number(this.data.selectedMonth);
    const today = todayIso();
    const firstWeekday = new Date(year, month - 1, 1).getDay();
    const cells: CalendarCell[] = [];
    for (let index = 0; index < firstWeekday; index += 1) {
      cells.push({
        key: `blank-${index}`,
        label: "",
        amountText: "",
        amountClass: "empty-amount",
        cellClass: "blank-cell"
      });
    }
    for (let day = 1; day <= daysInMonth(year, month); day += 1) {
      const date = isoFromParts(year, month, day);
      const amount = Number(amountMap[date] || 0);
      cells.push({
        key: date,
        label: `${day}`,
        amountText: expenseText(amount),
        amountClass: amountClass(amount),
        cellClass: `${amount > 0 ? "spent-cell" : ""} ${date === today ? "current-cell" : ""}`.trim()
      });
    }
    return cells;
  },

  buildWeekCells(): CalendarCell[] {
    const amountMap = this.amountByDate();
    const year = Number(this.data.selectedYear);
    const month = Number(this.data.selectedMonth);
    const today = dateFromIso(todayIso());
    const start = startOfMondayWeek(new Date(year, month - 1, 1));
    const end = addDays(startOfMondayWeek(new Date(year, month - 1, daysInMonth(year, month))), 6);
    const cells: CalendarCell[] = [];
    for (let cursor = new Date(start); cursor.getTime() <= end.getTime(); cursor = addDays(cursor, 7)) {
      const weekEnd = addDays(cursor, 6);
      const amount = this.sumBetween(cursor, weekEnd, amountMap);
      const isCurrent = today.getTime() >= cursor.getTime() && today.getTime() <= weekEnd.getTime();
      const label = isCurrent ? "本周" : `${pad(cursor.getMonth() + 1)}.${pad(cursor.getDate())}-${pad(weekEnd.getMonth() + 1)}.${pad(weekEnd.getDate())}`;
      cells.push({
        key: isoFromDate(cursor),
        label,
        amountText: expenseText(amount),
        amountClass: amountClass(amount),
        cellClass: `${amount > 0 ? "spent-cell" : ""} ${isCurrent ? "current-cell" : ""}`.trim()
      });
    }
    return cells;
  },

  buildMonthCells(): CalendarCell[] {
    const amountMap = this.amountByDate();
    const year = Number(this.data.selectedYear);
    const today = dateFromIso(todayIso());
    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const amount = this.sumMonth(year, month, amountMap);
      const isCurrent = year === today.getFullYear() && month === today.getMonth() + 1;
      return {
        key: `${year}-${pad(month)}`,
        label: isCurrent ? "本月" : `${month}月`,
        amountText: expenseText(amount),
        amountClass: amountClass(amount),
        cellClass: `${amount > 0 ? "spent-cell" : ""} ${isCurrent ? "current-cell" : ""}`.trim()
      };
    });
  },

  buildYearCells(): CalendarCell[] {
    const amountMap = this.amountByDate();
    const today = dateFromIso(todayIso());
    const currentYear = today.getFullYear();
    const selectedYear = Number(this.data.selectedYear);
    const years = Object.keys(amountMap).map((date) => Number(date.slice(0, 4))).filter(Boolean);
    const firstYear = Math.min(...years, selectedYear, currentYear);
    const lastYear = Math.min(selectedYear, currentYear);
    const cells: CalendarCell[] = [];
    for (let year = firstYear; year <= lastYear; year += 1) {
      const amount = this.sumYear(year, amountMap);
      const isCurrent = year === currentYear;
      cells.push({
        key: `${year}`,
        label: isCurrent ? "本年" : `${year}年`,
        amountText: expenseText(amount),
        amountClass: amountClass(amount),
        cellClass: `${amount > 0 ? "spent-cell" : ""} ${isCurrent ? "current-cell" : ""}`.trim()
      });
    }
    return cells;
  },

  canGoPrevious(): boolean {
    if (this.data.viewMode !== "year") return true;
    const years = getAllBillViews().map((bill) => Number(bill.date.slice(0, 4))).filter(Boolean);
    const firstYear = years.length ? Math.min(...years) : dateFromIso(todayIso()).getFullYear();
    return Number(this.data.selectedYear) > firstYear;
  },

  canGoNext(): boolean {
    const today = dateFromIso(todayIso());
    if (this.data.viewMode === "day" || this.data.viewMode === "week") {
      return Number(this.data.selectedYear) < today.getFullYear() || Number(this.data.selectedMonth) < today.getMonth() + 1;
    }
    return Number(this.data.selectedYear) < today.getFullYear();
  },

  setViewMode(event: any) {
    const viewMode = event.currentTarget.dataset.mode as CalendarMode;
    this.setData({ viewMode });
    this.refreshCalendar();
  },

  onMonthPick(event: any) {
    const { year, month } = parseMonthValue(event.detail.value);
    const today = dateFromIso(todayIso());
    if (!year || !month || year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth() + 1)) {
      wx.showToast({ title: "当前选择的时间有误", icon: "none" });
      return;
    }
    this.setData({ selectedYear: year, selectedMonth: month });
    this.refreshCalendar();
  },

  onYearPick(event: any) {
    const year = Number(event.detail.value);
    const currentYear = dateFromIso(todayIso()).getFullYear();
    if (!year || year > currentYear) {
      wx.showToast({ title: "当前选择的时间有误", icon: "none" });
      return;
    }
    this.setData({ selectedYear: year });
    this.refreshCalendar();
  },

  goPrevious() {
    if (!this.data.canGoPrevious) return;
    if (this.data.viewMode === "day" || this.data.viewMode === "week") {
      const previous = new Date(Number(this.data.selectedYear), Number(this.data.selectedMonth) - 2, 1);
      this.setData({ selectedYear: previous.getFullYear(), selectedMonth: previous.getMonth() + 1 });
    } else {
      this.setData({ selectedYear: Number(this.data.selectedYear) - 1 });
    }
    this.refreshCalendar();
  },

  goNext() {
    if (!this.data.canGoNext) return;
    if (this.data.viewMode === "day" || this.data.viewMode === "week") {
      const next = new Date(Number(this.data.selectedYear), Number(this.data.selectedMonth), 1);
      this.setData({ selectedYear: next.getFullYear(), selectedMonth: next.getMonth() + 1 });
    } else {
      this.setData({ selectedYear: Number(this.data.selectedYear) + 1 });
    }
    this.refreshCalendar();
  },

  openRecordModal() {
    if (!this.data.items.length) {
      wx.showToast({ title: "请先添加物品", icon: "none" });
      return;
    }
    this.setData({ recordModalVisible: true });
  },

  closeRecordModal() {
    this.setData({ recordModalVisible: false });
  },

  noop() {},

  onItemChange(event: any) {
    const itemIndex = Number(event.detail.value);
    this.setData({
      itemIndex,
      selectedItemName: this.data.items[itemIndex]?.name || ""
    });
  },

  onDateChange(event: any) {
    const selectedDate = event.detail.value;
    const today = todayIso();
    if (compareIsoDate(selectedDate, today) > 0) {
      this.setData({
        "form.date": today,
        formDateText: formatDotDate(today)
      });
      wx.showToast({ title: "当前填写的时间有误", icon: "none" });
      return;
    }
    this.setData({
      "form.date": selectedDate,
      formDateText: formatDotDate(selectedDate)
    });
  },

  onPlatformChange(event: any) {
    const platformIndex = Number(event.detail.value);
    const platform = platforms[platformIndex];
    this.setData({
      platformIndex,
      "form.platform": platform,
      "form.platformDetail": needsPlatformDetail(platform) ? this.data.form.platformDetail : "",
      requiresPlatformDetail: needsPlatformDetail(platform)
    });
  },

  onPlatformDetailInput(event: any) {
    this.setData({ "form.platformDetail": event.detail.value });
  },

  onPriceInput(event: any) {
    this.setData({ "form.price": event.detail.value });
  },

  onQuantityInput(event: any) {
    this.setData({ "form.quantity": event.detail.value });
  },

  submitBill() {
    const item = this.data.items[this.data.itemIndex];
    const price = Number(this.data.form.price);
    const quantity = Number(this.data.form.quantity || 1);
    if (!item) {
      wx.showToast({ title: "请选择物品", icon: "none" });
      return;
    }
    if (!price) {
      wx.showToast({ title: "请填写价格", icon: "none" });
      return;
    }
    if (quantity <= 0) {
      wx.showToast({ title: "请填写数量", icon: "none" });
      return;
    }
    const platformDetail = String(this.data.form.platformDetail || "").trim();
    if (needsPlatformDetail(this.data.form.platform) && !platformDetail) {
      wx.showToast({ title: "请填写具体地点", icon: "none" });
      return;
    }
    addBill(item.id, {
      date: this.data.form.date,
      platform: this.data.form.platform,
      platformDetail,
      price,
      quantity
    });
    this.setData({
      recordModalVisible: false,
      "form.platformDetail": "",
      "form.price": "",
      "form.quantity": "1"
    });
    this.onShow();
    wx.showToast({ title: "已添加" });
  },

  goHome() {
    wx.redirectTo({ url: "/pages/index/index" });
  },

  goInventory() {
    wx.redirectTo({ url: "/pages/inventory/inventory" });
  },

  goReminder() {
    wx.redirectTo({ url: "/pages/reminder/reminder" });
  },

  goBills() {
    wx.redirectTo({ url: "/pages/bills/bills" });
  },

  goProfile() {
    wx.navigateTo({ url: "/pages/profile/profile" });
  }
});
