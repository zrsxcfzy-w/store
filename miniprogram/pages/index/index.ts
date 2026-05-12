import {
  CategoryTag,
  House,
  ItemView,
  LocationTag,
  currentHouse,
  deleteItem,
  exportShoppingList,
  finishCoreOnboarding,
  getItemViews,
  getOnboarding,
  setCoreOnboardingStep,
  skipCoreOnboarding,
  sortItems,
  updateTagName
} from "../../services/store";

const CORE_STEP_COUNT = 6;

type OnboardingOverlayData = {
  visible: boolean;
  target: string;
  stepText: string;
  title: string;
  text: string;
  primaryText: string;
  secondaryText: string;
  showSecondary: boolean;
  finishMode: boolean;
};

const hiddenOnboarding: OnboardingOverlayData = {
  visible: false,
  target: "center",
  stepText: "",
  title: "",
  text: "",
  primaryText: "下一步",
  secondaryText: "跳过",
  showSecondary: true,
  finishMode: false
};

Page({
  data: {
    house: {} as House,
    items: [] as ItemView[],
    filteredItems: [] as ItemView[],
    searchKeyword: "",
    activeLocationId: "",
    activeCategoryId: "",
    manualVisible: false,
    onboarding: hiddenOnboarding,
    manualText: [
      "本小程序用于记录家中物品的库存、位置、购买记录和预计采购时间。",
      "核心流程：添加物品后，记录每次购买；程序会根据购买记录、库存和平台送达时间估算下次采购。",
      "首页：搜索、按位置/分类筛选、查看物品卡片、导出采购清单。",
      "详情页：修改物品信息、消耗库存、添加购买记录、查看购买周期。",
      "提醒页：汇总库存较少或快到采购时间的物品，可一键复制提醒清单。",
      "我的：管理仓库、分类、位置、单位，并进行数据备份和恢复。"
    ]
  },

  onShow() {
    this.refresh();
    this.refreshCoreOnboarding();
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
    this.setData({ manualVisible: false });
  },

  refreshCoreOnboarding() {
    const state = getOnboarding();
    if (state.coreFinished || state.skippedCore || state.coreStep > 2) {
      this.setData({ onboarding: hiddenOnboarding });
      return;
    }
    this.setData({ onboarding: this.buildHomeOnboarding(state.coreStep) });
  },

  buildHomeOnboarding(step: number): OnboardingOverlayData {
    if (!this.data.items.length && step > 0) {
      return {
        ...hiddenOnboarding,
        visible: true,
        stepText: `新手教程 ${step + 1} / ${CORE_STEP_COUNT}`,
        title: "先添加一个自己的物品",
        text: "当前仓库没有物品。点击这里开始添加，保存后就能继续体验库存、账单和提醒。",
        primaryText: "添加物品",
        secondaryText: "跳过",
        finishMode: true
      };
    }
    const steps: OnboardingOverlayData[] = [
      {
        ...hiddenOnboarding,
        visible: true,
        stepText: `新手教程 1 / ${CORE_STEP_COUNT}`,
        title: "先用一分钟看懂库存管家",
        text: "它帮你记住物品放在哪里、还剩多少，并在快用完或快到采购时间时提醒你。",
        primaryText: "开始看看",
        secondaryText: "跳过"
      },
      {
        ...hiddenOnboarding,
        visible: true,
        target: "home-card",
        stepText: `新手教程 2 / ${CORE_STEP_COUNT}`,
        title: "物品卡片就是库存概览",
        text: "卡片会显示物品图片、剩余库存、购买周期、预计购买时间和所在位置。库存少或已到期会直接标出来。",
        primaryText: "下一步",
        secondaryText: "跳过"
      },
      {
        ...hiddenOnboarding,
        visible: true,
        target: "home-filter",
        stepText: `新手教程 3 / ${CORE_STEP_COUNT}`,
        title: "用搜索、位置和分类快速找东西",
        text: "上方可以搜索物品名，横向色块按位置筛选，左侧分类按用途筛选。点击加号可以添加新物品。",
        primaryText: "查看详情",
        secondaryText: "跳过"
      }
    ];
    return steps[Math.min(step, steps.length - 1)];
  },

  onOnboardingPrimary() {
    const step = getOnboarding().coreStep;
    if (!this.data.items.length && step > 0) {
      finishCoreOnboarding();
      this.setData({ onboarding: hiddenOnboarding });
      wx.navigateTo({ url: "/pages/edit/edit" });
      return;
    }
    const next = step + 1;
    if (next === 3) {
      const item = this.data.filteredItems[0] || this.data.items[0];
      setCoreOnboardingStep(next);
      this.setData({ onboarding: hiddenOnboarding });
      if (item) {
        wx.navigateTo({ url: `/pages/detail/detail?id=${item.id}` });
      } else {
        finishCoreOnboarding();
        wx.navigateTo({ url: "/pages/edit/edit" });
      }
      return;
    }
    setCoreOnboardingStep(next);
    this.setData({ onboarding: this.buildHomeOnboarding(next) });
  },

  onOnboardingSecondary() {
    skipCoreOnboarding();
    this.setData({ onboarding: hiddenOnboarding });
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
    this.refreshCoreOnboarding();
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

  goAccounting() {
    wx.navigateTo({ url: "/pages/accounting/accounting" });
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
