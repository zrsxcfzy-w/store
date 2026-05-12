import { resetManualAndGuide } from "../../services/store";

Page({
  data: {
    version: "1.0.0"
  },

  reopenGuide() {
    resetManualAndGuide();
    wx.showToast({ title: "已重置引导" });
    setTimeout(() => wx.redirectTo({ url: "/pages/index/index" }), 400);
  },

  goBack() {
    wx.navigateBack();
  }
});
