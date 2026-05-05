import { BillRecord, getAllBillViews } from "../../services/store";

Page({
  data: {
    bills: [] as Array<BillRecord & { itemName: string; unit: string; displayDate: string; itemMark: string }>
  },

  onShow() {
    this.setData({
      bills: getAllBillViews().map((bill) => ({
        ...bill,
        itemMark: bill.itemName.slice(0, 1)
      }))
    });
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
