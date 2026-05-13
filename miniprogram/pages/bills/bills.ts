import {
  BillView,
  CategoryTag,
  InventoryItem,
  LocationTag,
  addBill,
  addOrUpdateItem,
  addStandaloneBill,
  currentHouse,
  defaultItemImage,
  deleteBill,
  deleteBillsByDate,
  deleteBillsByDates,
  getAllBillViews,
  markOnboardingHintSeen,
  shouldShowOnboardingHint
} from "../../services/store";
import { DeliveryPlatform, compareIsoDate, formatDotDate, todayIso } from "../../utils/date";

type PurchaseMode = "stock" | "standalone";
type StockEntryMode = "existing" | "new";

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

function splitDetailText(text: string): string[] {
  return text
    .split(/[>＞,，/]/)
    .map((part: string) => part.trim())
    .filter(Boolean);
}

type BillRecordView = BillView & {
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
    allGroupsCollapsed: false,
    items: [] as InventoryItem[],
    locations: [] as LocationTag[],
    categories: [] as CategoryTag[],
    units: [] as string[],
    itemIndex: 0,
    selectedItemName: "",
    purchaseMode: "stock" as PurchaseMode,
    stockEntryMode: "existing" as StockEntryMode,
    locationIndex: 0,
    categoryIndex: 0,
    unitIndex: 0,
    locationName: "",
    categoryName: "",
    unitName: "",
    platforms,
    platformIndex: 0,
    recordModalVisible: false,
    form: {
      itemName: "",
      imageUrl: "",
      locationDetailText: "",
      date: todayIso(),
      platform: "京东" as DeliveryPlatform,
      platformDetail: "",
      price: "",
      quantity: "1"
    },
    formDateText: formatDotDate(todayIso()),
    requiresPlatformDetail: false,
    hintVisible: false
  },

  onShow() {
    const house = currentHouse();
    const today = todayIso();
    const itemIndex = Math.min(this.data.itemIndex, Math.max(house.items.length - 1, 0));
    const locationIndex = Math.min(this.data.locationIndex, Math.max(house.locations.length - 1, 0));
    const categoryIndex = Math.min(this.data.categoryIndex, Math.max(house.categories.length - 1, 0));
    const unitIndex = Math.min(this.data.unitIndex, Math.max(house.units.length - 1, 0));
    if (compareIsoDate(this.data.form.date, today) > 0) {
      this.setData({
        "form.date": today,
        formDateText: formatDotDate(today)
      });
    }
    this.setData({
      items: house.items,
      locations: house.locations,
      categories: house.categories,
      units: house.units,
      itemIndex,
      selectedItemName: house.items[itemIndex]?.name || "",
      stockEntryMode: house.items.length ? this.data.stockEntryMode : "new",
      locationIndex,
      categoryIndex,
      unitIndex,
      locationName: house.locations[locationIndex]?.name || "",
      categoryName: house.categories[categoryIndex]?.name || "",
      unitName: house.units[unitIndex] || "",
      collapsedDateMap: {},
      allGroupsCollapsed: false,
      billGroups: this.buildBillGroups({})
    });
    if (shouldShowOnboardingHint("bills")) this.setData({ hintVisible: true });
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
    this.setData({
      recordModalVisible: true,
      stockEntryMode: this.data.items.length ? this.data.stockEntryMode : "new"
    });
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

  toggleAllDateGroups() {
    const allGroupsCollapsed = !this.data.allGroupsCollapsed;
    const collapsedDateMap: Record<string, boolean> = {};
    if (allGroupsCollapsed) {
      this.data.billGroups.forEach((group) => {
        collapsedDateMap[group.date] = true;
      });
    }
    this.setData({
      allGroupsCollapsed,
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

  setPurchaseMode(event: any) {
    const purchaseMode = event.currentTarget.dataset.mode as PurchaseMode;
    if (!purchaseMode) return;
    this.setData({ purchaseMode });
  },

  setStockEntryMode(event: any) {
    const stockEntryMode = event.currentTarget.dataset.mode as StockEntryMode;
    if (!stockEntryMode) return;
    if (stockEntryMode === "existing" && !this.data.items.length) {
      wx.showToast({ title: "暂无库存物品", icon: "none" });
      return;
    }
    this.setData({ stockEntryMode });
  },

  onItemChange(event: any) {
    const itemIndex = Number(event.detail.value);
    this.setData({
      itemIndex,
      selectedItemName: this.data.items[itemIndex]?.name || ""
    });
  },

  onItemNameInput(event: any) {
    this.setData({ "form.itemName": event.detail.value });
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res: any) => {
        this.setData({ "form.imageUrl": res.tempFiles[0].tempFilePath });
      }
    });
  },

  onLocationChange(event: any) {
    const locationIndex = Number(event.detail.value);
    this.setData({
      locationIndex,
      locationName: this.data.locations[locationIndex]?.name || ""
    });
  },

  onCategoryChange(event: any) {
    const categoryIndex = Number(event.detail.value);
    this.setData({
      categoryIndex,
      categoryName: this.data.categories[categoryIndex]?.name || ""
    });
  },

  onUnitChange(event: any) {
    const unitIndex = Number(event.detail.value);
    this.setData({
      unitIndex,
      unitName: this.data.units[unitIndex] || ""
    });
  },

  onDetailInput(event: any) {
    this.setData({ "form.locationDetailText": event.detail.value });
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
    const price = Number(this.data.form.price);
    const quantity = Number(this.data.form.quantity || 1);
    if (!price || price <= 0) {
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
    const bill = {
      date: this.data.form.date,
      platform: this.data.form.platform,
      platformDetail,
      price,
      quantity
    };

    if (this.data.purchaseMode === "standalone") {
      const itemName = String(this.data.form.itemName || "").trim();
      if (!itemName) {
        wx.showToast({ title: "请填写物品名称", icon: "none" });
        return;
      }
      addStandaloneBill({
        ...bill,
        itemName,
        unit: this.data.unitName || "件"
      });
    } else if (this.data.stockEntryMode === "new") {
      const itemName = String(this.data.form.itemName || "").trim();
      if (!itemName) {
        wx.showToast({ title: "请填写物品名称", icon: "none" });
        return;
      }
      const itemId = addOrUpdateItem({
        name: itemName,
        imageUrl: this.data.form.imageUrl || defaultItemImage(itemName),
        locationId: this.data.locations[this.data.locationIndex]?.id || "",
        categoryId: this.data.categories[this.data.categoryIndex]?.id || "",
        unit: this.data.unitName || "件",
        locationDetail: splitDetailText(this.data.form.locationDetailText),
        manualConsumption: 0,
        bills: []
      });
      addBill(itemId, bill);
    } else {
      const item = this.data.items[this.data.itemIndex];
      if (!item) {
        wx.showToast({ title: "请选择物品", icon: "none" });
        return;
      }
      addBill(item.id, bill);
    }

    this.setData({
      recordModalVisible: false,
      "form.itemName": "",
      "form.imageUrl": "",
      "form.locationDetailText": "",
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

  goAccounting() {
    wx.redirectTo({ url: "/pages/accounting/accounting" });
  },

  goProfile() {
    wx.navigateTo({ url: "/pages/profile/profile" });
  },

  closeHint() {
    markOnboardingHintSeen("bills");
    this.setData({ hintVisible: false });
  }
});
