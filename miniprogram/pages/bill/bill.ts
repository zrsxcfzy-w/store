import { BillRecord, SortMode, addBill, formatBillDate, getItem } from "../../services/store";
import { DeliveryPlatform, compareIsoDate, formatChineseDate, todayIso } from "../../utils/date";

const platforms: DeliveryPlatform[] = ["京东", "淘宝", "拼多多", "线下超市", "其他平台"];

Page({
  data: {
    itemId: "",
    item: null as any,
    sortMode: "priceAsc" as SortMode,
    sortedBills: [] as Array<BillRecord & { displayDate: string; platformMark: string; deliveryLabel: string }>,
    unit: "",
    platforms,
    platformIndex: 0,
    form: {
      date: todayIso(),
      platform: "京东" as DeliveryPlatform,
      price: "",
      quantity: "1"
    },
    formDateText: formatChineseDate(todayIso())
  },

  onLoad(options: any) {
    this.setData({ itemId: options.id || "" });
  },

  onShow() {
    const today = todayIso();
    if (compareIsoDate(this.data.form.date, today) > 0) {
      this.setData({
        "form.date": today,
        formDateText: formatChineseDate(today)
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

  sortBills() {
    if (!this.data.item) return;
    const bills = [...this.data.item.bills];
    if (this.data.sortMode === "priceAsc") bills.sort((a, b) => Number(a.price) - Number(b.price));
    if (this.data.sortMode === "priceDesc") bills.sort((a, b) => Number(b.price) - Number(a.price));
    if (this.data.sortMode === "timeDesc") {
      bills.sort((a, b) => new Date(`${b.date}T00:00:00`).getTime() - new Date(`${a.date}T00:00:00`).getTime());
    }
    this.setData({
      sortedBills: bills.map((bill) => ({
        ...bill,
        displayDate: formatBillDate(bill.date),
        platformMark: bill.platform.slice(0, 1),
        deliveryLabel: `${bill.platform === "线下超市" ? "线下" : bill.platform}${bill.platform === "线下超市" ? "0" : bill.platform === "京东" ? "2" : "3"}天`
      }))
    });
  },

  goBack() {
    wx.navigateBack();
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
    const platform = platforms[Number(event.detail.value)];
    this.setData({
      platformIndex: Number(event.detail.value),
      "form.platform": platform
    });
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
    addBill(this.data.itemId, {
      date: this.data.form.date,
      platform: this.data.form.platform,
      price,
      quantity
    });
    this.setData({
      "form.price": "",
      "form.quantity": "1"
    });
    this.refresh();
    wx.showToast({ title: "已添加" });
  }
});
