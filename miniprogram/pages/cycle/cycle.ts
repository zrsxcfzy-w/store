import { ItemView, getItem } from "../../services/store";
import { formatChineseDate } from "../../utils/date";

Page({
  data: {
    itemId: "",
    item: null as ItemView | null,
    previousPurchaseDateText: "暂无记录",
    lastPurchaseDateText: "暂无记录",
    nextSuggestedDateText: "暂无记录"
  },

  onLoad(options: any) {
    this.setData({ itemId: options.id || "" });
  },

  onShow() {
    const item = getItem(this.data.itemId);
    if (!item) return;
    this.setData({
      item,
      previousPurchaseDateText: formatChineseDate(item.previousPurchaseDate),
      lastPurchaseDateText: formatChineseDate(item.lastPurchaseDate),
      nextSuggestedDateText: formatChineseDate(item.nextSuggestedDate)
    });
  },

  goBack() {
    wx.navigateBack();
  },

  confirm() {
    wx.navigateBack();
  }
});
