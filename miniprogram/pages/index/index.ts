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

const CORE_STEP_COUNT = 5;
const GUIDE_HIGHLIGHT_PADDING = 8;
const GUIDE_CARD_GAP = 14;
const GUIDE_CARD_MARGIN = 16;
const GUIDE_CARD_ESTIMATED_HEIGHT = 196;

type OnboardingOverlayData = {
  visible: boolean;
  target: string;
  variant: string;
  stepText: string;
  title: string;
  text: string;
  primaryText: string;
  secondaryText: string;
  showSecondary: boolean;
  finishMode: boolean;
  highlightStyle: string;
  cardStyle: string;
};

type ManualSection = {
  title: string;
  items: string[];
};

const hiddenOnboarding: OnboardingOverlayData = {
  visible: false,
  target: "center",
  variant: "default",
  stepText: "",
  title: "",
  text: "",
  primaryText: "下一步",
  secondaryText: "跳过",
  showSecondary: true,
  finishMode: false,
  highlightStyle: "",
  cardStyle: ""
};

type HomeOnboardingStep = {
  target: string;
  selector?: string;
  title: string;
  text: string;
  primaryText?: string;
  finishMode?: boolean;
};

type GuideOverlayStyles = {
  highlightStyle: string;
  cardStyle: string;
};

const HOME_ONBOARDING_STEPS: HomeOnboardingStep[] = [
  {
    target: "center",
    title: "欢迎使用“库存管家”小程序~~",
    text: "先用几个步骤熟悉首页常用入口。",
    primaryText: "下一步"
  },
  {
    target: "manual-button",
    selector: ".guide-manual-button",
    title: "查看使用说明",
    text: "点击“查看使用说明”，可以阅读本小程序的使用说明书。",
    primaryText: "下一步"
  },
  {
    target: "export-button",
    selector: ".guide-export-button",
    title: "导出清单",
    text: "点击“导出清单”，可将即将需要购买的物品清单复制下来，方便购买。",
    primaryText: "下一步"
  },
  {
    target: "add-button",
    selector: ".guide-add-button",
    title: "新建库存",
    text: "点击“+”号，可新建库存。",
    primaryText: "下一步"
  },
  {
    target: "profile-tab",
    selector: ".guide-profile-tab",
    title: "更多功能",
    text: "点击“我的”处，有更多功能等你来使用~~",
    primaryText: "去我的看看",
    finishMode: true
  }
];

function viewportSize() {
  const info = typeof wx.getWindowInfo === "function" ? wx.getWindowInfo() : wx.getSystemInfoSync();
  return {
    windowWidth: Number(info.windowWidth || 0),
    windowHeight: Number(info.windowHeight || 0)
  };
}

function guideOverlayStyles(rect: any): GuideOverlayStyles {
  const viewport = viewportSize();
  const top = Math.max(0, Number(rect.top || 0) - GUIDE_HIGHLIGHT_PADDING);
  const left = Math.max(0, Number(rect.left || 0) - GUIDE_HIGHLIGHT_PADDING);
  const maxWidth = viewport.windowWidth ? Math.max(0, viewport.windowWidth - left - GUIDE_HIGHLIGHT_PADDING) : Number(rect.width || 0);
  const width = Math.max(0, Math.min(Number(rect.width || 0) + GUIDE_HIGHLIGHT_PADDING * 2, maxWidth));
  const height = Math.max(0, Number(rect.height || 0) + GUIDE_HIGHLIGHT_PADDING * 2);
  const bottom = Number(rect.bottom || top + height);
  const canPlaceBelow = viewport.windowHeight - bottom > GUIDE_CARD_ESTIMATED_HEIGHT + GUIDE_CARD_MARGIN;
  const cardStyle = canPlaceBelow
    ? `top: ${Math.round(bottom + GUIDE_CARD_GAP)}px;`
    : `bottom: ${Math.round(Math.max(GUIDE_CARD_MARGIN, viewport.windowHeight - top + GUIDE_CARD_GAP))}px;`;

  return {
    highlightStyle: `top: ${Math.round(top)}px; left: ${Math.round(left)}px; width: ${Math.round(width)}px; height: ${Math.round(height)}px;`,
    cardStyle
  };
}

const manualSections: ManualSection[] = [
  {
    title: "快速开始",
    items: [
      "第一次用时，先到“我的”改房子名称，也可以上传头像。",
      "点首页左侧“+”添加第一个物品，先把名称、位置、分类和单位填好。",
      "买东西后记一条购买记录，库存、价格和提醒会跟着更新。"
    ]
  },
  {
    title: "首页",
    items: [
      "首页就是你的物品总览，当前仓库的物品都在这里看。",
      "上方可以搜物品名；点位置色块或左侧分类，可以只看一部分物品。",
      "点物品卡片看详情；长按物品可以删除。",
      "点“导出清单”会复制需要采购的物品清单，方便发给自己或家人。"
    ]
  },
  {
    title: "添加/编辑物品",
    items: [
      "图片可以拍照、从相册选，也可以先不传。",
      "物品名称必须填写；位置、分类和单位从已有选项里选。",
      "具体位置可以写细一点，比如“阳台柜 > 第二层”。"
    ]
  },
  {
    title: "物品详情",
    items: [
      "在详情页可以直接改名称、图片、所在位置和具体位置。",
      "库存旁边的“-”用来记录已经用掉的数量。",
      "库存旁边的“+”用来添加购买记录，买了多少就填多少。",
      "点“账单”看这个物品的购买记录，点“周期”看下次建议购买时间。"
    ]
  },
  {
    title: "库存",
    items: [
      "库存页把物品分成“库存为0”和“库存不为0”两类。",
      "不缺货的物品会优先显示库存更少的，方便先处理快用完的。",
      "点物品可以进入详情继续修改或记账。"
    ]
  },
  {
    title: "提醒",
    items: [
      "提醒页会把快用完、已到期、快到建议购买日期的物品放在一起。",
      "点“复制提醒清单”后，可以直接粘贴到聊天里。"
    ]
  },
  {
    title: "账单",
    items: [
      "账单页按日期整理所有购买记录，每天买了什么、花了多少钱都能看。",
      "添加记录时，选“加入库存”会增加库存；选“不加入库存”只记消费。",
      "记录加入库存后，这个物品的库存、价格区间和下次购买时间会跟着变。",
      "长按单条记录可以删除，也可以按日期批量删除。"
    ]
  },
  {
    title: "记账",
    items: [
      "记账页可以按日、周、月、年看消费情况。",
      "点“添加消费记录”也可以选择是否加入库存。",
      "购买时间不能选未来日期，填错日期时系统会提醒你。"
    ]
  },
  {
    title: "周期",
    items: [
      "周期页会显示最近两次购买时间、购买周期和下次建议购买日期。",
      "简单理解：系统看你多久买一次，再提前几天提醒你去买。",
      "默认送达时间是京东2天、淘宝3天、拼多多3天、线下0天、其他平台3天。"
    ]
  },
  {
    title: "我的与仓库",
    items: [
      "“我的”里可以改房子名称、上传头像，也能进入各类管理功能。",
      "可以创建新仓库或切换仓库；不同仓库的数据分开保存。",
      "删除仓库后不用太担心，它会先放进“已删除仓库”，以后还能恢复。"
    ]
  },
  {
    title: "分类、位置、单位管理",
    items: [
      "分类、位置、单位都可以新增、改名、上移、下移和删除。",
      "如果某个分类、位置或单位正在被物品使用，删除前需要先迁移或替换。",
      "首页长按位置色块或分类，也可以快速改名。"
    ]
  },
  {
    title: "备份与恢复",
    items: [
      "本地备份会生成一个 JSON 文件，也会把备份文本复制到剪贴板。",
      "云端备份需要云开发环境，手动备份后会保留最近10个版本。",
      "恢复前先看预览；“导入为新仓库”不会影响现有数据。",
      "“覆盖当前仓库”会替换当前仓库内容，操作前会自动留一份本地安全备份。",
      "自己上传的本地图片，换手机或换设备后可能无法恢复。"
    ]
  },
  {
    title: "关于与反馈",
    items: [
      "“关于我们”里可以查看版本、数据保存说明和隐私说明。",
      "如果想重新看新手引导，可以在“关于我们”里重置。",
      "遇到问题可以点“问题反馈”告诉我们。"
    ]
  }
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
    onboarding: hiddenOnboarding,
    manualSections
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
    if (state.coreFinished || state.skippedCore) {
      this.setData({ onboarding: hiddenOnboarding });
      return;
    }
    if (state.coreStep >= CORE_STEP_COUNT) {
      finishCoreOnboarding();
      this.setData({ onboarding: hiddenOnboarding });
      return;
    }
    this.showHomeOnboarding(Math.max(0, state.coreStep));
  },

  showHomeOnboarding(step: number) {
    const safeStep = Math.min(Math.max(0, step), CORE_STEP_COUNT - 1);
    const config = HOME_ONBOARDING_STEPS[safeStep];
    if (!config.selector) {
      this.setData({ onboarding: this.buildHomeOnboarding(safeStep) });
      return;
    }
    this.setData({ onboarding: hiddenOnboarding });
    setTimeout(() => {
      wx.createSelectorQuery()
        .select(config.selector || "")
        .boundingClientRect((rect: any) => {
          this.setData({
            onboarding: this.buildHomeOnboarding(safeStep, rect ? guideOverlayStyles(rect) : undefined)
          });
        })
        .exec();
    }, 0);
  },

  buildHomeOnboarding(step: number, styles?: GuideOverlayStyles): OnboardingOverlayData {
    const config = HOME_ONBOARDING_STEPS[Math.min(Math.max(0, step), CORE_STEP_COUNT - 1)];
    return {
      ...hiddenOnboarding,
      visible: true,
      target: styles || !config.selector ? config.target : "center",
      variant: "guide",
      stepText: `新手教程 ${step + 1} / ${CORE_STEP_COUNT}`,
      title: config.title,
      text: config.text,
      primaryText: config.primaryText || "下一步",
      secondaryText: "跳过",
      finishMode: config.finishMode || false,
      highlightStyle: styles?.highlightStyle || "",
      cardStyle: styles?.cardStyle || ""
    };
  },

  onOnboardingPrimary() {
    const step = getOnboarding().coreStep;
    if (step >= CORE_STEP_COUNT - 1) {
      finishCoreOnboarding();
      this.setData({ onboarding: hiddenOnboarding });
      wx.navigateTo({ url: "/pages/profile/profile" });
      return;
    }
    const next = step + 1;
    setCoreOnboardingStep(next);
    this.showHomeOnboarding(next);
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
