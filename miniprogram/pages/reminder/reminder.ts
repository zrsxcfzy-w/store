import { ItemView, getItemViews, reminderListText } from "../../services/store";
import { daysBetween, todayIso } from "../../utils/date";

Page({
  data: {
    items: [] as ItemView[],
    reminderText: ""
  },

  onShow() {
    const items = getItemViews().filter(
      (item) => item.stock <= 1 || item.nextSuggestedText === "已到期" || daysBetween(todayIso(), item.nextSuggestedDate) <= 3
    );
    this.setData({ items, reminderText: reminderListText() || "当前没有需要提醒的物品" });
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
  },

  goDetail(event: any) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${event.currentTarget.dataset.id}` });
  }
});
