import { ItemView, getItem, markOnboardingHintSeen, shouldShowOnboardingHint } from "../../services/store";
import { formatChineseDate } from "../../utils/date";

Page({
  data: {
    itemId: "",
    item: null as ItemView | null,
    previousPurchaseDateText: "暂无记录",
    lastPurchaseDateText: "暂无记录",
    nextSuggestedDateText: "暂无记录",
    hintVisible: false
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
    if (shouldShowOnboardingHint("cycle")) this.setData({ hintVisible: true });
  },

  goBack() {
    wx.navigateBack();
  },

  confirm() {
    wx.navigateBack();
  },

  closeHint() {
    markOnboardingHintSeen("cycle");
    this.setData({ hintVisible: false });
  }
});
