import {
  BillRecord,
  InventoryItem,
  addBill,
  currentHouse,
  deleteBill,
  deleteBillsByDate,
  deleteBillsByDates,
  getAllBillViews
} from "../../services/store";
import { DeliveryPlatform, compareIsoDate, formatDotDate, todayIso } from "../../utils/date";

const platforms: DeliveryPlatform[] = ["京东", "淘宝", "拼多多", "线下超市", "其他平台"];
const platformColors: Record<DeliveryPlatform, string> = {
  "京东": "#e1251b",
  "淘宝": "#ff5000",
  "拼多多": "#e02e24",
  "线下超市": "#42a85f",
  "其他平台": "#686de0"
};

function platformMark(platform: DeliveryPlatform): string {
  if (platform === "线下超市") return "线下";
  if (platform === "其他平台") return "其他";
  return platform.slice(0, 1);
}

function needsPlatformDetail(platform: DeliveryPlatform): boolean {
  return platform === "线下超市" || platform === "其他平台";
}

type BillRecordView = BillRecord & {
  itemName: string;
  unit: string;
  displayDate: string;
  displayPlatform: string;
  platformMark: string;
  platformColor: string;
};

type DateBillGroup = {
  date: string;
  displayDate: string;
  expanded: boolean;
  selected: boolean;
  totalQuantity: number;
  totalAmount: string;
  records: BillRecordView[];
};

Page({
  data: {
    billGroups: [] as DateBillGroup[],
    collapsedDateMap: {} as Record<string, boolean>,
    selectedDateMap: {} as Record<string, boolean>,
    selectedDateCount: 0,
    batchDeleteMode: false,
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
      selectedItemName: house.items[itemIndex]?.name || "",
      billGroups: this.buildBillGroups()
    });
  },

  buildBillGroups(collapsedDateMap?: Record<string, boolean>, selectedDateMap?: Record<string, boolean>): DateBillGroup[] {
    const collapsedMap = collapsedDateMap || this.data.collapsedDateMap;
    const selectedMap = selectedDateMap || this.data.selectedDateMap;
    const groups: DateBillGroup[] = [];
    const groupIndexByDate: Record<string, number> = {};

    getAllBillViews().forEach((bill) => {
      const record: BillRecordView = {
        ...bill,
        displayPlatform: bill.platformDetail || bill.platform,
        platformMark: platformMark(bill.platform),
        platformColor: platformColors[bill.platform]
      };
      const index = groupIndexByDate[bill.date];
      if (index === undefined) {
        groupIndexByDate[bill.date] = groups.length;
        groups.push({
          date: bill.date,
          displayDate: bill.displayDate,
          expanded: collapsedMap[bill.date] !== true,
          selected: selectedMap[bill.date] === true,
          totalQuantity: Number(bill.quantity || 0),
          totalAmount: (Number(bill.price || 0) * Number(bill.quantity || 0)).toFixed(2),
          records: [record]
        });
        return;
      }

      const group = groups[index];
      const nextQuantity = Number(group.totalQuantity || 0) + Number(bill.quantity || 0);
      const nextAmount = Number(group.totalAmount || 0) + Number(bill.price || 0) * Number(bill.quantity || 0);
      group.totalQuantity = nextQuantity;
      group.totalAmount = nextAmount.toFixed(2);
      group.records.push(record);
    });

    return groups;
  },

  refreshBillGroups() {
    const billGroups = this.buildBillGroups();
    const selectedDateMap: Record<string, boolean> = {};
    billGroups.forEach((group) => {
      if (group.selected) selectedDateMap[group.date] = true;
    });
    this.setData({
      billGroups,
      selectedDateMap,
      selectedDateCount: Object.keys(selectedDateMap).length
    });
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

  toggleDateGroup(event: any) {
    const date = event.currentTarget.dataset.date;
    if (!date) return;
    const collapsedDateMap = {
      ...this.data.collapsedDateMap,
      [date]: this.data.collapsedDateMap[date] !== true
    };
    this.setData({
      collapsedDateMap,
      billGroups: this.buildBillGroups(collapsedDateMap)
    });
  },

  deleteDateGroup(event: any) {
    const date = event.currentTarget.dataset.date;
    if (!date) return;
    wx.showModal({
      title: "删除确认",
      content: `确定删除${formatDotDate(date)}的所有记录吗？`,
      confirmText: "删除",
      confirmColor: "#e64340",
      success: (res) => {
        if (!res.confirm) return;
        deleteBillsByDate(date);
        this.refreshBillGroups();
        wx.showToast({ title: "已删除" });
      }
    });
  },

  toggleBatchDelete() {
    const batchDeleteMode = !this.data.batchDeleteMode;
    this.setData({
      batchDeleteMode,
      selectedDateMap: {},
      selectedDateCount: 0
    });
    this.refreshBillGroups();
  },

  toggleDateSelection(event: any) {
    const date = event.currentTarget.dataset.date;
    if (!date) return;
    const selectedDateMap = { ...this.data.selectedDateMap };
    if (selectedDateMap[date]) {
      delete selectedDateMap[date];
    } else {
      selectedDateMap[date] = true;
    }
    this.setData({
      selectedDateMap,
      selectedDateCount: Object.keys(selectedDateMap).length,
      billGroups: this.buildBillGroups(this.data.collapsedDateMap, selectedDateMap)
    });
  },

  confirmBatchDeleteDates() {
    const dates = Object.keys(this.data.selectedDateMap);
    if (!dates.length) {
      wx.showToast({ title: "请选择日期", icon: "none" });
      return;
    }
    wx.showModal({
      title: "删除确认",
      content: `确定删除选中的${dates.length}天记录吗？`,
      confirmText: "删除",
      confirmColor: "#e64340",
      success: (res) => {
        if (!res.confirm) return;
        deleteBillsByDates(dates);
        this.setData({
          batchDeleteMode: false,
          selectedDateMap: {},
          selectedDateCount: 0
        });
        this.refreshBillGroups();
        wx.showToast({ title: "已删除" });
      }
    });
  },

  onRecordLongPress(event: any) {
    const billId = event.currentTarget.dataset.id;
    if (!billId) return;
    wx.showModal({
      title: "删除记录",
      content: "确定删除这条账单记录吗？",
      cancelText: "取消",
      confirmText: "删除",
      confirmColor: "#e64340",
      success: (res) => {
        if (!res.confirm) return;
        deleteBill(billId);
        this.refreshBillGroups();
        wx.showToast({ title: "已删除" });
      }
    });
  },

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

  goProfile() {
    wx.navigateTo({ url: "/pages/profile/profile" });
  }
});
