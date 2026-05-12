import { finishCoreOnboarding, getOnboarding, reminderListText } from "../../services/store";

const hiddenOnboarding = {
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
    reminderText: "",
    onboarding: hiddenOnboarding
  },

  onShow() {
    this.setData({ reminderText: reminderListText() || "当前没有需要提醒的物品" });
    this.refreshCoreOnboarding();
  },

  refreshCoreOnboarding() {
    const state = getOnboarding();
    if (state.coreFinished || state.skippedCore || state.coreStep !== 5) {
      this.setData({ onboarding: hiddenOnboarding });
      return;
    }
    this.setData({
      onboarding: {
        ...hiddenOnboarding,
        visible: true,
        target: "reminder-panel",
        stepText: "新手教程 6 / 6",
        title: "提醒页汇总需要采购的物品",
        text: "库存很少、已到期或快到建议购买日期的物品会出现在这里。复制提醒清单后，可以直接发给自己或家人。",
        primaryText: "添加自己的物品",
        secondaryText: "先自己看看",
        finishMode: true
      }
    });
  },

  copyReminder() {
    wx.setClipboardData({ data: this.data.reminderText });
  },

  onOnboardingPrimary() {
    finishCoreOnboarding();
    this.setData({ onboarding: hiddenOnboarding });
    wx.navigateTo({ url: "/pages/edit/edit" });
  },

  onOnboardingSecondary() {
    finishCoreOnboarding();
    this.setData({ onboarding: hiddenOnboarding });
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

  goAccounting() {
    wx.redirectTo({ url: "/pages/accounting/accounting" });
  },

  goProfile() {
    wx.navigateTo({ url: "/pages/profile/profile" });
  }
});
