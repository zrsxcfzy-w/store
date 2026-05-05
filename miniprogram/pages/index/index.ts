import {
  CategoryTag,
  House,
  ItemView,
  LocationTag,
  currentHouse,
  deleteItem,
  exportShoppingList,
  getItemViews,
  loadStore,
  setGuideFinished,
  setManualRead,
  updateTagName
} from "../../services/store";

const guideTexts = [
  "这里显示当前管理的房子名称，名称来自“我的”页面。",
  "可以在这里搜索物品名称。",
  "点击这里可以随时查看使用方法。",
  "点击导出快要购买或库存较少的物品清单。",
  "长按位置格子可以编辑名称。",
  "长按分类格子可以编辑名称。",
  "长按物品卡片可以删除，点击物品卡片可以查看完整信息。",
  "点击加号可以添加新物品。",
  "点击“我的”可以设置房子信息。"
];

Page({
  data: {
    house: {} as House,
    items: [] as ItemView[],
    filteredItems: [] as ItemView[],
    searchKeyword: "",
    activeLocationId: "",
    activeCategoryId: "",
    manualVisible: false,
    guideVisible: false,
    guideStep: 0,
    guideStepText: 1,
    guideText: guideTexts[0],
    manualText: [
      "欢迎使用家庭库存管理小程序。",
      "你可以用它记录家里的纸巾、洗漱用品、粮油调料、母婴用品等物品库存，查看物品放在哪里、还剩多少、什么时候需要再买。",
      "1. 第一次使用时，请先进入“我的”页面填写房子名称。",
      "2. 点击主页面底部上方的“+”按钮，可以添加新物品。",
      "3. 在物品详细信息页面，可以通过“+”和“-”调整库存；点击“+”会进入账单页面。",
      "4. 主页面会按库存和预计购买时间自动排序，库存越少、越快需要购买的物品越靠前。",
      "5. 长按位置格子、分类格子可以快速修改名称；长按物品卡片可以删除，点击物品卡片可以查看完整信息。",
      "6. 每次购买物品时，可以在账单页面记录时间、平台、价格和数量。",
      "7. 周期页面会根据最近两次购买记录计算购买周期，并结合平台默认送达时间给出建议购买日期。",
      "8. 点击“导出清单”，可以复制快要购买或库存较少的物品清单。"
    ]
  },

  onShow() {
    this.refresh();
    const store = loadStore();
    if (!store.hasReadManual) {
      this.setData({ manualVisible: true });
    } else if (!store.hasFinishedGuide) {
      this.startGuide();
    }
  },

  refresh() {
    const house = currentHouse();
    const items = getItemViews();
    this.setData({ house, items });
    this.applySearch();
  },

  applySearch() {
    const keyword = this.data.searchKeyword.trim();
    const filteredItems = this.data.items.filter((item: ItemView) => {
      const matchesKeyword = keyword ? item.name.includes(keyword) : true;
      const matchesLocation = this.data.activeLocationId ? item.locationId === this.data.activeLocationId : true;
      const matchesCategory = this.data.activeCategoryId ? item.categoryId === this.data.activeCategoryId : true;
      return matchesKeyword && matchesLocation && matchesCategory;
    });
    this.setData({ filteredItems });
  },

  onSearchInput(event: any) {
    this.setData({ searchKeyword: event.detail.value });
    this.applySearch();
  },

  openManual() {
    this.setData({ manualVisible: true });
  },

  closeManual() {
    setManualRead();
    this.setData({ manualVisible: false });
    if (!loadStore().hasFinishedGuide) this.startGuide();
  },

  startGuide() {
    this.setData({
      guideVisible: true,
      guideStep: 0,
      guideStepText: 1,
      guideText: guideTexts[0]
    });
  },

  nextGuide() {
    const next = this.data.guideStep + 1;
    if (next >= guideTexts.length) {
      setGuideFinished();
      this.setData({ guideVisible: false });
      return;
    }
    this.setData({
      guideStep: next,
      guideStepText: next + 1,
      guideText: guideTexts[next]
    });
  },

  exportList() {
    const text = exportShoppingList();
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showModal({
          title: "购物清单已复制",
          content: text,
          showCancel: false
        });
      }
    });
  },

  goEdit() {
    wx.navigateTo({ url: "/pages/edit/edit" });
  },

  goProfile() {
    wx.navigateTo({ url: "/pages/profile/profile" });
  },

  goHome() {
    this.setData({ activeLocationId: "", activeCategoryId: "", searchKeyword: "" });
    this.applySearch();
  },

  goInventory() {
    wx.navigateTo({ url: "/pages/inventory/inventory" });
  },

  goReminder() {
    wx.navigateTo({ url: "/pages/reminder/reminder" });
  },

  goBills() {
    wx.navigateTo({ url: "/pages/bills/bills" });
  },

  goDetail(event: any) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/detail/detail?id=${id}` });
  },

  onItemLongPress(event: any) {
    const { id } = event.currentTarget.dataset;
    wx.showActionSheet({
      itemList: ["删除"],
      success: (res: any) => {
        if (res.tapIndex === 0) {
          wx.showModal({
            title: "删除物品",
            content: "删除后该物品的信息将不再存在。",
            success: (modal: any) => {
              if (modal.confirm) {
                deleteItem(id);
                this.refresh();
              }
            }
          });
        }
      }
    });
  },

  onLocationLongPress(event: any) {
    const { id, name } = event.currentTarget.dataset;
    this.editTag("location", id, name);
  },

  onLocationTap(event: any) {
    const { id } = event.currentTarget.dataset;
    const activeLocationId = this.data.activeLocationId === id ? "" : id;
    this.setData({ activeLocationId });
    this.applySearch();
  },

  clearFilters() {
    this.setData({ activeLocationId: "", activeCategoryId: "" });
    this.applySearch();
  },

  onCategoryLongPress(event: any) {
    const { id, name } = event.currentTarget.dataset;
    this.editTag("category", id, name);
  },

  onCategoryTap(event: any) {
    const { id } = event.currentTarget.dataset;
    const activeCategoryId = this.data.activeCategoryId === id ? "" : id;
    this.setData({ activeCategoryId });
    this.applySearch();
  },

  editTag(kind: "location" | "category", tagId: string, currentName: string) {
    wx.showModal({
      title: kind === "location" ? "修改位置名称" : "修改分类名称",
      editable: true,
      placeholderText: "请输入新名称",
      content: currentName,
      success: (res: any) => {
        const name = (res.content || "").trim();
        if (res.confirm && name) {
          updateTagName(kind, tagId, name);
          this.refresh();
        }
      }
    });
  }
});
