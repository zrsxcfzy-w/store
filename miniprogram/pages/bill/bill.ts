import {
  BillRecord,
  SortMode,
  addBill,
  deleteBill,
  deleteBills,
  formatBillDate,
  getItem,
  sortBillsByDateDescPriceDesc
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

Page({
  data: {
    itemId: "",
    item: null as any,
    sortMode: "priceAsc" as SortMode,
    sortedBills: [] as Array<
      BillRecord & {
        displayDate: string;
        displayPlatform: string;
        platformMark: string;
        platformColor: string;
        selected: boolean;
      }
    >,
    selectedBillMap: {} as Record<string, boolean>,
    selectedBillCount: 0,
    batchDeleteMode: false,
    unit: "",
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

  onLoad(options: any) {
    this.setData({ itemId: options.id || "" });
  },

  onShow() {
    const today = todayIso();
    if (compareIsoDate(this.data.form.date, today) > 0) {
      this.setData({
        "form.date": today,
        formDateText: formatDotDate(today)
      });
    }
    this.refresh();
  },

  refresh() {
    const item = getItem(this.data.itemId);
    if (!item) return;
    this.setData({ item, unit: item.unit });
    this.sortBills();
  },

  setSort(event: any) {
    this.setData({ sortMode: event.currentTarget.dataset.mode });
    this.sortBills();
  },

  sortBills(selectedBillMap?: Record<string, boolean>) {
    if (!this.data.item) return;
    const selectedMap = selectedBillMap || this.data.selectedBillMap;
    const bills = [...this.data.item.bills];
    if (this.data.sortMode === "priceAsc") bills.sort((a, b) => Number(a.price) - Number(b.price));
    if (this.data.sortMode === "priceDesc") bills.sort((a, b) => Number(b.price) - Number(a.price));
    if (this.data.sortMode === "timeDesc") bills.sort(sortBillsByDateDescPriceDesc);
    this.setData({
      sortedBills: bills.map((bill) => ({
        ...bill,
        displayDate: formatBillDate(bill.date),
        displayPlatform: bill.platformDetail || bill.platform,
        platformMark: platformMark(bill.platform),
        platformColor: platformColors[bill.platform],
        selected: selectedMap[bill.id] === true
      }))
    });
  },

  goBack() {
    wx.navigateBack();
  },

  openBillModal() {
    this.setData({ recordModalVisible: true });
  },

  closeBillModal() {
    this.setData({ recordModalVisible: false });
  },

  noop() {},

  onRecordLongPress(event: any) {
    const billId = event.currentTarget.dataset.id;
    if (!billId) return;
    wx.showModal({
      title: "删除记录",
      content: "确定删除这条购买记录吗？",
      cancelText: "取消",
      confirmText: "删除",
      confirmColor: "#e64340",
      success: (res) => {
        if (!res.confirm) return;
        deleteBill(billId);
        this.refresh();
        wx.showToast({ title: "已删除" });
      }
    });
  },

  toggleBatchDelete() {
    const batchDeleteMode = !this.data.batchDeleteMode;
    this.setData({
      batchDeleteMode,
      selectedBillMap: {},
      selectedBillCount: 0
    });
    this.sortBills({});
  },

  toggleBillSelection(event: any) {
    const billId = event.currentTarget.dataset.id;
    if (!billId) return;
    const selectedBillMap = { ...this.data.selectedBillMap };
    if (selectedBillMap[billId]) {
      delete selectedBillMap[billId];
    } else {
      selectedBillMap[billId] = true;
    }
    this.setData({
      selectedBillMap,
      selectedBillCount: Object.keys(selectedBillMap).length
    });
    this.sortBills(selectedBillMap);
  },

  confirmBatchDeleteBills() {
    const billIds = Object.keys(this.data.selectedBillMap);
    if (!billIds.length) {
      wx.showToast({ title: "请选择记录", icon: "none" });
      return;
    }
    wx.showModal({
      title: "删除确认",
      content: `确定删除选中的${billIds.length}条记录吗？`,
      confirmText: "删除",
      confirmColor: "#e64340",
      success: (res) => {
        if (!res.confirm) return;
        deleteBills(billIds);
        this.setData({
          batchDeleteMode: false,
          selectedBillMap: {},
          selectedBillCount: 0
        });
        this.refresh();
        wx.showToast({ title: "已删除" });
      }
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
    const platform = platforms[Number(event.detail.value)];
    this.setData({
      platformIndex: Number(event.detail.value),
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
    const price = Number(this.data.form.price);
    const quantity = Number(this.data.form.quantity || 1);
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
    addBill(this.data.itemId, {
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
    this.refresh();
    wx.showToast({ title: "已添加" });
  }
});
