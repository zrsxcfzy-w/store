import { ItemView, getItemViews, markOnboardingHintSeen, shouldShowOnboardingHint } from "../../services/store";

type StockFilter = "zero" | "nonzero";

function sortByNamePinyin(a: ItemView, b: ItemView): number {
  return a.name.localeCompare(b.name, "zh-CN-u-co-pinyin");
}

function sortByStockAsc(a: ItemView, b: ItemView): number {
  const aStock = Number(a.stock || 0);
  const bStock = Number(b.stock || 0);
  if (aStock !== bStock) return aStock - bStock;
  return sortByNamePinyin(a, b);
}

Page({
  data: {
    items: [] as ItemView[],
    stockFilter: "zero" as StockFilter,
    hintVisible: false
  },

  onShow() {
    this.refreshItems(this.data.stockFilter);
    if (shouldShowOnboardingHint("inventory")) this.setData({ hintVisible: true });
  },

  refreshItems(stockFilter: StockFilter) {
    const items = getItemViews()
      .filter((item) => (stockFilter === "zero" ? item.stock === 0 : item.stock !== 0))
      .sort(stockFilter === "zero" ? sortByNamePinyin : sortByStockAsc);
    this.setData({ items });
  },

  setStockFilter(event: any) {
    const stockFilter = event.currentTarget.dataset.filter as StockFilter;
    this.setData({ stockFilter });
    this.refreshItems(stockFilter);
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

  goAccounting() {
    wx.redirectTo({ url: "/pages/accounting/accounting" });
  },

  goProfile() {
    wx.navigateTo({ url: "/pages/profile/profile" });
  },

  goDetail(event: any) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${event.currentTarget.dataset.id}` });
  },

  closeHint() {
    markOnboardingHintSeen("inventory");
    this.setData({ hintVisible: false });
  }
});
