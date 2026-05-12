import {
  House,
  currentHouse,
  deleteCurrentHouse,
  listDeletedHouses,
  listHouses,
  markOnboardingHintSeen,
  restoreDeletedHouse,
  shouldShowOnboardingHint,
  switchToHouse,
  switchToNewHouse,
  updateAvatar,
  updateHouseName
} from "../../services/store";

Page({
  data: {
    house: {} as House,
    switchModalVisible: false,
    switchableHouses: [] as House[],
    switchableHouseNames: [] as string[],
    switchHouseIndex: 0,
    selectedSwitchHouseName: "",
    deletedModalVisible: false,
    deletedHouses: [] as House[],
    deletedHouseNames: [] as string[],
    deletedHouseIndex: 0,
    selectedDeletedHouseName: "",
    hintVisible: false,
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
    if (shouldShowOnboardingHint("profile")) this.setData({ hintVisible: true });
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
    const routeMap: Record<string, string> = {
      "数据备份": "/pages/backup/backup",
      "数据恢复": "/pages/restore/restore",
      "分类管理": "/pages/categoryManage/categoryManage",
      "位置管理": "/pages/locationManage/locationManage",
      "单位管理": "/pages/unitManage/unitManage",
      "关于我们": "/pages/about/about"
    };
    const url = routeMap[name];
    if (url) wx.navigateTo({ url });
  },

  createNewHouse() {
    switchToNewHouse();
    wx.showToast({ title: "已创建仓库" });
    wx.redirectTo({ url: "/pages/index/index" });
  },

  openSwitchHouseModal() {
    const current = currentHouse();
    const houses = listHouses().filter((house) => house.id !== current.id);
    if (!houses.length) {
      wx.showToast({ title: "暂无其他仓库", icon: "none" });
      return;
    }
    this.setData({
      switchModalVisible: true,
      switchableHouses: houses,
      switchableHouseNames: houses.map((house) => house.name || "未命名仓库"),
      switchHouseIndex: 0,
      selectedSwitchHouseName: houses[0]?.name || "未命名仓库"
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
      selectedSwitchHouseName: house?.name || "未命名仓库"
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
    wx.showToast({ title: "已切换仓库" });
    wx.redirectTo({ url: "/pages/index/index" });
  },

  deleteHouse() {
    const houses = listHouses();
    const current = currentHouse();
    wx.showModal({
      title: "删除此仓库",
      content:
        houses.length <= 1
          ? "当前只有一个仓库，请确认是否要删除本仓库。删除后会自动创建一个新的空仓库，原仓库可在“已删除仓库”中找回。"
          : `确定删除“${current.name || "未命名仓库"}”吗？删除后可在“已删除仓库”中找回。`,
      confirmText: "删除",
      confirmColor: "#e64340",
      success: (res) => {
        if (!res.confirm) return;
        deleteCurrentHouse();
        wx.showToast({ title: "已删除仓库" });
        wx.redirectTo({ url: "/pages/index/index" });
      }
    });
  },

  openDeletedHouseModal() {
    const houses = listDeletedHouses();
    if (!houses.length) {
      wx.showToast({ title: "暂无已删除仓库", icon: "none" });
      return;
    }
    this.setData({
      deletedModalVisible: true,
      deletedHouses: houses,
      deletedHouseNames: houses.map((house) => house.name || "未命名仓库"),
      deletedHouseIndex: 0,
      selectedDeletedHouseName: houses[0]?.name || "未命名仓库"
    });
  },

  closeDeletedHouseModal() {
    this.setData({ deletedModalVisible: false });
  },

  onDeletedHouseChange(event: any) {
    const deletedHouseIndex = Number(event.detail.value);
    const house = this.data.deletedHouses[deletedHouseIndex];
    this.setData({
      deletedHouseIndex,
      selectedDeletedHouseName: house?.name || "未命名仓库"
    });
  },

  confirmRestoreDeletedHouse() {
    const house = this.data.deletedHouses[this.data.deletedHouseIndex];
    if (!house) {
      wx.showToast({ title: "请选择已删除仓库", icon: "none" });
      return;
    }
    const restored = restoreDeletedHouse(house.id);
    if (!restored) {
      wx.showToast({ title: "恢复失败", icon: "none" });
      return;
    }
    this.setData({ deletedModalVisible: false });
    wx.showToast({ title: "已恢复仓库" });
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

  goAccounting() {
    wx.navigateTo({ url: "/pages/accounting/accounting" });
  },

  goProfile() {
    this.setData({ house: currentHouse() });
  },

  closeHint() {
    markOnboardingHintSeen("profile");
    this.setData({ hintVisible: false });
  }
});
