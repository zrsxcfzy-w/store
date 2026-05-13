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
    this.setData({ onboarding: hiddenOnboarding });
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
