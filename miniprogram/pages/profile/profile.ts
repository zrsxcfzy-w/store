import { House, currentHouse, listHouses, switchToHouse, switchToNewHouse, updateAvatar, updateHouseName } from "../../services/store";

Page({
  data: {
    house: {} as House,
    switchModalVisible: false,
    switchableHouses: [] as House[],
    switchableHouseNames: [] as string[],
    switchHouseIndex: 0,
    selectedSwitchHouseName: "",
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
      itemList: ["创建新的家庭仓库", "切换到其他家庭仓库"],
      success: (res: any) => {
        if (res.tapIndex === 0) {
          switchToNewHouse();
          wx.showToast({ title: "已创建家庭仓库" });
          wx.redirectTo({ url: "/pages/index/index" });
          return;
        }
        this.openSwitchHouseModal();
      }
    });
  },

  openSwitchHouseModal() {
    const current = currentHouse();
    const houses = listHouses().filter((house) => house.id !== current.id);
    if (!houses.length) {
      wx.showToast({ title: "暂无其他家庭仓库", icon: "none" });
      return;
    }
    this.setData({
      switchModalVisible: true,
      switchableHouses: houses,
      switchableHouseNames: houses.map((house) => house.name || "未命名家庭仓库"),
      switchHouseIndex: 0,
      selectedSwitchHouseName: houses[0]?.name || "未命名家庭仓库"
    });
  },

  closeSwitchHouseModal() {
    this.setData({ switchModalVisible: false });
  },

  noop() {},

  onSwitchHouseChange(event: any) {
    const switchHouseIndex = Number(event.detail.value);
    const house = this.data.switchableHouses[switchHouseIndex];
    this.setData({
      switchHouseIndex,
      selectedSwitchHouseName: house?.name || "未命名家庭仓库"
    });
  },

  confirmSwitchHouse() {
    const house = this.data.switchableHouses[this.data.switchHouseIndex];
    if (!house) {
      wx.showToast({ title: "请选择家庭仓库", icon: "none" });
      return;
    }
    switchToHouse(house.id);
    this.setData({ switchModalVisible: false });
    wx.showToast({ title: "已切换家庭仓库" });
    wx.redirectTo({ url: "/pages/index/index" });
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
