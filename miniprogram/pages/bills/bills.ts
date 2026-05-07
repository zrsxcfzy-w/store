import { BillRecord, InventoryItem, addBill, currentHouse, getAllBillViews } from "../../services/store";
import { DeliveryPlatform, compareIsoDate, formatChineseDate, todayIso } from "../../utils/date";

const platforms: DeliveryPlatform[] = ["京东", "淘宝", "拼多多", "线下超市", "其他平台"];
const platformColors: Record<DeliveryPlatform, string> = {
  "京东": "#e1251b",
  "淘宝": "#ff5000",
  "拼多多": "#e02e24",
  "线下超市": "#42a85f",
  "其他平台": "#686de0"
};

Page({
  data: {
    bills: [] as Array<
      BillRecord & {
        itemName: string;
        unit: string;
        displayDate: string;
        platformMark: string;
        platformColor: string;
      }
    >,
    items: [] as InventoryItem[],
    itemIndex: 0,
    selectedItemName: "",
    platforms,
    platformIndex: 0,
    recordModalVisible: false,
    form: {
      date: todayIso(),
      platform: "京东" as DeliveryPlatform,
      price: "",
      quantity: "1"
    },
    formDateText: formatChineseDate(todayIso())
  },

  onShow() {
    const house = currentHouse();
    const today = todayIso();
    const itemIndex = Math.min(this.data.itemIndex, Math.max(house.items.length - 1, 0));
    if (compareIsoDate(this.data.form.date, today) > 0) {
      this.setData({
        "form.date": today,
        formDateText: formatChineseDate(today)
      });
    }
    this.setData({
      items: house.items,
      itemIndex,
      selectedItemName: house.items[itemIndex]?.name || "",
      bills: getAllBillViews().map((bill) => ({
        ...bill,
        platformMark: bill.platform.slice(0, 1),
        platformColor: platformColors[bill.platform]
      }))
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
        formDateText: formatChineseDate(today)
      });
      wx.showToast({ title: "当前填写的时间有误", icon: "none" });
      return;
    }
    this.setData({
      "form.date": selectedDate,
      formDateText: formatChineseDate(selectedDate)
    });
  },

  onPlatformChange(event: any) {
    const platformIndex = Number(event.detail.value);
    this.setData({
      platformIndex,
      "form.platform": platforms[platformIndex]
    });
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
    addBill(item.id, {
      date: this.data.form.date,
      platform: this.data.form.platform,
      price,
      quantity
    });
    this.setData({
      recordModalVisible: false,
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
