import { reminderListText } from "../../services/store";

Page({
  data: {
    reminderText: ""
  },

  onShow() {
    this.setData({ reminderText: reminderListText() || "当前没有需要提醒的物品" });
  },

  copyReminder() {
    wx.setClipboardData({ data: this.data.reminderText });
  },

  goHome() {
    wx.redirectTo({ url: "/pages/index/index" });
  },

  goInventory() {
    wx.redirectTo({ url: "/pages/inventory/inventory" });
  },

  goBills() {
    wx.redirectTo({ url: "/pages/bills/bills" });
  },

  goProfile() {
    wx.navigateTo({ url: "/pages/profile/profile" });
  }
});
