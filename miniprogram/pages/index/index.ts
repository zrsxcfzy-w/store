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
  sortItems,
  updateTagName
} from "../../services/store";

const guideTexts = [
  "这里显示当前管理的房子名称，名称来自“我的”页面。",
  "可以在这里搜索物品名称。",
  "点击这里可以随时查看使用说明。",
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
      "本小程序用于记录家中物品的库存、位置、购买记录和预计采购时间。",
      "1. 在“我的”页面设置房子名称。",
      "2. 首页点击“+”添加物品；点击物品卡片查看详情。",
      "3. 详情页可调整库存，也可进入该物品的购买记录。",
      "4. 首页和库存页会按库存数量、预计购买时间自动排序。",
      "5. 预计购买显示“已到期”时，请及时采购。",
      "6. 在“账单”页或物品购买记录页添加购买记录，填写时间、平台、价格和数量。",
      "7. 周期页会根据购买记录估算采购周期和建议购买日期。",
      "8. 长按位置、分类可改名；长按物品卡片可删除物品。",
      "9. 点击“导出清单”可复制需要采购的物品清单。"
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
    }).sort(sortItems);
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
    const shoppingList = exportShoppingList();
    wx.setClipboardData({
      data: shoppingList.content,
      success: () => {
        wx.showModal({
          title: shoppingList.count ? "购物清单已复制" : "暂无需要购买",
          content: shoppingList.summary,
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
