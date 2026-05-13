import {
  House,
  ItemView,
  addOrUpdateItem,
  consumeItem,
  currentHouse,
  getItem,
  getOnboarding,
  setCoreOnboardingStep,
  skipCoreOnboarding
} from "../../services/store";

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

function detailTextFor(item: ItemView): string {
  const parts = item.locationName === "其他" ? item.locationDetail : [item.locationName, ...item.locationDetail];
  const text = parts.filter(Boolean).join(" > ");
  if (!text && item.locationName !== "其他") return `${item.locationName} > `;
  return text;
}

function parseDetailText(text: string, locationName: string): string[] {
  const parts = text
    .split(">")
    .map((part) => part.trim())
    .filter(Boolean);
  if (locationName !== "其他" && parts[0] === locationName) return parts.slice(1);
  return parts;
}

Page({
  data: {
    itemId: "",
    item: null as ItemView | null,
    house: {} as House,
    locations: [] as House["locations"],
    locationIndex: 0,
    detailText: "",
    stockReduceOptions: ["0"] as string[],
    onboarding: hiddenOnboarding
  },

  onLoad(options: any) {
    this.setData({ itemId: options.id || "" });
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const house = currentHouse();
    const item = getItem(this.data.itemId);
    if (!item) {
      wx.showToast({ title: "物品不存在", icon: "none" });
      setTimeout(() => wx.navigateBack(), 600);
      return;
    }
    const locationIndex = Math.max(0, house.locations.findIndex((location) => location.id === item.locationId));
    this.setData({
      house,
      locations: house.locations,
      item,
      locationIndex,
      detailText: detailTextFor(item),
      stockReduceOptions: Array.from({ length: item.stock + 1 }, (_entry, index) => `${index}`)
    });
    this.refreshCoreOnboarding();
  },

  refreshCoreOnboarding() {
    this.setData({ onboarding: hiddenOnboarding });
  },

  buildDetailOnboarding(step: number): OnboardingOverlayData {
    if (step === 3) {
      return {
        ...hiddenOnboarding,
        visible: true,
        target: "home-detail",
        stepText: "新手教程 4 / 6",
        title: "详情页负责看清一个物品",
        text: "这里可以修改名称、位置和具体存放路径，也能看到剩余库存、预计购买时间和价格区间。",
        primaryText: "下一步",
        secondaryText: "跳过"
      };
    }
    return {
      ...hiddenOnboarding,
      visible: true,
      target: "detail-stock",
      stepText: "新手教程 5 / 6",
      title: "购买记录会推动库存和周期",
      text: "库存旁边的“+”会进入账单记录。记录购买时间、平台、价格和数量后，库存、周期和预计购买时间都会更新。",
      primaryText: "去看提醒",
      secondaryText: "跳过"
    };
  },

  onOnboardingPrimary() {
    const step = getOnboarding().coreStep;
    if (step === 3) {
      setCoreOnboardingStep(4);
      this.setData({ onboarding: this.buildDetailOnboarding(4) });
      return;
    }
    setCoreOnboardingStep(5);
    this.setData({ onboarding: hiddenOnboarding });
    wx.redirectTo({ url: "/pages/reminder/reminder" });
  },

  onOnboardingSecondary() {
    skipCoreOnboarding();
    this.setData({ onboarding: hiddenOnboarding });
  },

  goBill() {
    wx.navigateTo({ url: `/pages/bill/bill?id=${this.data.itemId}` });
  },

  goCycle() {
    wx.navigateTo({ url: `/pages/cycle/cycle?id=${this.data.itemId}` });
  },

  goEdit() {
    wx.navigateTo({ url: `/pages/edit/edit?id=${this.data.itemId}` });
  },

  goBack() {
    wx.navigateBack();
  },

  onReduceStockChange(event: any) {
    const quantity = Number(this.data.stockReduceOptions[Number(event.detail.value)] || 0);
    if (quantity <= 0) return;
    consumeItem(this.data.itemId, quantity);
    this.refresh();
  },

  onNameInput(event: any) {
    const name = event.detail.value;
    addOrUpdateItem({ id: this.data.itemId, name });
    this.setData({ "item.name": name });
  },

  onLocationChange(event: any) {
    const locationIndex = Number(event.detail.value);
    const location = this.data.locations[locationIndex];
    if (!location || !this.data.item) return;
    const locationDetail = parseDetailText(this.data.detailText, this.data.item.locationName);
    addOrUpdateItem({ id: this.data.itemId, locationId: location.id, locationDetail });
    this.refresh();
  },

  onDetailInput(event: any) {
    if (!this.data.item) return;
    const detailText = event.detail.value;
    const locationDetail = parseDetailText(detailText, this.data.item.locationName);
    addOrUpdateItem({ id: this.data.itemId, locationDetail });
    this.setData({ detailText });
  },

  chooseImage() {
    wx.showActionSheet({
      itemList: ["拍照", "从相册上传"],
      success: (res: any) => {
        if (res.tapIndex === 0) {
          wx.authorize({
            scope: "scope.camera",
            success: () => (this as any).pickImage(["camera"]),
            fail: () => {
              wx.showModal({
                title: "需要相机权限",
                content: "请在设置中允许相机权限后再拍照。",
                success: (modal: any) => {
                  if (modal.confirm) wx.openSetting();
                }
              });
            }
          });
          return;
        }
        (this as any).pickImage(["album"]);
      }
    });
  },

  pickImage(sourceType: Array<"album" | "camera">) {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType,
      success: (res: any) => {
        const imageUrl = res.tempFiles[0].tempFilePath;
        addOrUpdateItem({ id: this.data.itemId, imageUrl });
        this.refresh();
      }
    });
  }
});
