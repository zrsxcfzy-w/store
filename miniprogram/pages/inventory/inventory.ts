import { ItemView, getItemViews, sortItems } from "../../services/store";

Page({
  data: {
    items: [] as ItemView[]
  },

  onShow() {
    this.setData({ items: getItemViews().sort(sortItems) });
  },

  goHome() {
    wx.redirectTo({ url: "/pages/index/index" });
  },

  goReminder() {
    wx.redirectTo({ url: "/pages/reminder/reminder" });
  },

  goBills() {
    wx.redirectTo({ url: "/pages/bills/bills" });
  },

  goProfile() {
    wx.navigateTo({ url: "/pages/profile/profile" });
  },

  goDetail(event: any) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${event.currentTarget.dataset.id}` });
  }
});
