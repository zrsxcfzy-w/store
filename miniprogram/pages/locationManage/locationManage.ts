import { LOCATION_COLOR_PALETTE, currentHouse, deleteLocation, moveLocation, upsertLocation } from "../../services/store";

const colorNames = [
  "肉粉色",
  "橙粉色",
  "藕粉色",
  "草莓粉",
  "浅橘色",
  "柠檬黄",
  "浅黄色",
  "嫩芽绿",
  "薄荷绿",
  "蓝绿色",
  "天蓝色",
  "奶蓝色",
  "浅蓝",
  "蓝紫色",
  "浅紫色"
];

Page({
  data: {
    locations: [] as Array<{ id: string; name: string; color: string; count: number }>
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const house = currentHouse();
    const locations = house.locations.map((location) => ({
      ...location,
      count: house.items.filter((item) => item.locationId === location.id).length
    }));
    this.setData({ locations });
  },

  addLocation() {
    this.promptName("新增位置", "", (name) => {
      const color = LOCATION_COLOR_PALETTE[this.data.locations.length % LOCATION_COLOR_PALETTE.length];
      upsertLocation({ name, color });
      this.refresh();
    });
  },

  editLocation(event: any) {
    const { id, name, color } = event.currentTarget.dataset;
    this.promptName("修改位置名称", name, (nextName) => {
      upsertLocation({ id, name: nextName, color });
      this.refresh();
    });
  },

  changeColor(event: any) {
    const { id, name } = event.currentTarget.dataset;
    wx.showActionSheet({
      itemList: colorNames,
      success: (res) => {
        upsertLocation({ id, name, color: LOCATION_COLOR_PALETTE[res.tapIndex] });
        this.refresh();
      }
    });
  },

  moveLocation(event: any) {
    moveLocation(event.currentTarget.dataset.id, event.currentTarget.dataset.direction);
    this.refresh();
  },

  removeLocation(event: any) {
    const { id, name } = event.currentTarget.dataset;
    const count = Number(event.currentTarget.dataset.count || 0);
    if (this.data.locations.length <= 1) {
      wx.showToast({ title: "至少保留一个位置", icon: "none" });
      return;
    }
    if (!count) {
      this.confirmDelete(name, () => {
        deleteLocation(id);
        this.refresh();
      });
      return;
    }
    const candidates = this.data.locations.filter((location) => location.id !== id);
    wx.showActionSheet({
      itemList: candidates.map((location) => `迁移到：${location.name}`),
      success: (res) => {
        const replacement = candidates[res.tapIndex];
        if (!replacement) return;
        deleteLocation(id, replacement.id);
        wx.showToast({ title: "已迁移并删除" });
        this.refresh();
      }
    });
  },

  promptName(title: string, content: string, onConfirm: (name: string) => void) {
    wx.showModal({
      title,
      editable: true,
      placeholderText: "请输入名称",
      content,
      success: (res: any) => {
        const name = String(res.content || "").trim();
        if (res.confirm && name) onConfirm(name);
      }
    });
  },

  confirmDelete(name: string, onConfirm: () => void) {
    wx.showModal({
      title: "删除位置",
      content: `确定删除“${name}”吗？`,
      confirmText: "删除",
      confirmColor: "#e64340",
      success: (res) => {
        if (res.confirm) onConfirm();
      }
    });
  },

  goBack() {
    wx.navigateBack();
  }
});
