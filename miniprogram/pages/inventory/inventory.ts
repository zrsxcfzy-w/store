import { ItemView, getItemViews } from "../../services/store";

type StockFilter = "zero" | "nonzero";

function sortByNamePinyin(a: ItemView, b: ItemView): number {
  return a.name.localeCompare(b.name, "zh-CN-u-co-pinyin");
}

function sortByStockAsc(a: ItemView, b: ItemView): number {
  if (a.stock !== b.stock) return a.stock - b.stock;
  return sortByNamePinyin(a, b);
}

Page({
  data: {
    items: [] as ItemView[],
    stockFilter: "zero" as StockFilter
  },

  onShow() {
    this.refreshItems(this.data.stockFilter);
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

  goProfile() {
    wx.navigateTo({ url: "/pages/profile/profile" });
  },

  goDetail(event: any) {
    wx.navigateTo({ url: `/pages/detail/detail?id=${event.currentTarget.dataset.id}` });
  }
});
