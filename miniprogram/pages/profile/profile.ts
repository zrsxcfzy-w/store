import { House, currentHouse, listHouses, switchToHouse, switchToNewHouse, updateAvatar, updateHouseName } from "../../services/store";

Page({
  data: {
    house: {} as House,
    functions: [
      { name: "数据备份", icon: "☁", color: "green" },
      { name: "数据恢复", icon: "↓", color: "blue" },
      { name: "分类管理", icon: "▦", color: "orange" },
      { name: "位置管理", icon: "●", color: "blue" },
      { name: "单位管理", icon: "⚖", color: "purple" },
      { name: "关于我们", icon: "i", color: "red" }
    ]
  },

  onShow() {
    this.setData({ house: currentHouse() });
  },

  onNameInput(event: any) {
    const name = event.detail.value;
    updateHouseName(name);
    this.setData({ house: currentHouse() });
  },

  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res: any) => {
        const avatarUrl = res.tempFiles[0].tempFilePath;
        updateAvatar(avatarUrl);
        this.setData({ house: currentHouse() });
      }
    });
  },

  onFunctionTap(event: any) {
    const name = event.currentTarget.dataset.name;
    wx.showToast({ title: `${name}后续讨论`, icon: "none" });
  },

  switchHouse() {
    wx.showActionSheet({
      itemList: ["创建新的房子", "选择已创建的房子"],
      success: (res: any) => {
        if (res.tapIndex === 0) {
          switchToNewHouse();
          wx.showToast({ title: "已创建新房子" });
          wx.redirectTo({ url: "/pages/index/index" });
          return;
        }
        this.chooseExistingHouse();
      }
    });
  },

  chooseExistingHouse() {
    const current = currentHouse();
    const houses = listHouses().filter((house) => house.id !== current.id);
    if (!houses.length) {
      wx.showToast({ title: "暂无其他房子", icon: "none" });
      return;
    }
    wx.showActionSheet({
      itemList: houses.map((house) => house.name || "未命名房子"),
      success: (res: any) => {
        const house = houses[res.tapIndex];
        if (!house) return;
        switchToHouse(house.id);
        wx.showToast({ title: "已切换房子" });
        wx.redirectTo({ url: "/pages/index/index" });
      }
    });
  },

  goHome() {
    wx.redirectTo({ url: "/pages/index/index" });
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

  goProfile() {
    this.setData({ house: currentHouse() });
  }
});
