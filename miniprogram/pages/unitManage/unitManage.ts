import { currentHouse, deleteUnit, moveUnit, upsertUnit } from "../../services/store";

Page({
  data: {
    units: [] as Array<{ name: string; count: number }>
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const house = currentHouse();
    const units = house.units.map((unit) => ({
      name: unit,
      count: house.items.filter((item) => item.unit === unit).length
    }));
    this.setData({ units });
  },

  addUnit() {
    this.promptName("新增单位", "", (name) => {
      upsertUnit(name);
      this.refresh();
    });
  },

  editUnit(event: any) {
    const unit = event.currentTarget.dataset.name;
    this.promptName("修改单位名称", unit, (name) => {
      upsertUnit(name, unit);
      this.refresh();
    });
  },

  moveUnit(event: any) {
    moveUnit(event.currentTarget.dataset.name, event.currentTarget.dataset.direction);
    this.refresh();
  },

  removeUnit(event: any) {
    const unit = event.currentTarget.dataset.name;
    const count = Number(event.currentTarget.dataset.count || 0);
    if (this.data.units.length <= 1) {
      wx.showToast({ title: "至少保留一个单位", icon: "none" });
      return;
    }
    if (!count) {
      this.confirmDelete(unit, () => {
        deleteUnit(unit);
        this.refresh();
      });
      return;
    }
    const candidates = this.data.units.filter((entry) => entry.name !== unit);
    wx.showActionSheet({
      itemList: candidates.map((entry) => `替换为：${entry.name}`),
      success: (res) => {
        const replacement = candidates[res.tapIndex];
        if (!replacement) return;
        deleteUnit(unit, replacement.name);
        wx.showToast({ title: "已替换并删除" });
        this.refresh();
      }
    });
  },

  promptName(title: string, content: string, onConfirm: (name: string) => void) {
    wx.showModal({
      title,
      editable: true,
      placeholderText: "请输入单位",
      content,
      success: (res: any) => {
        const name = String(res.content || "").trim();
        if (res.confirm && name) onConfirm(name);
      }
    });
  },

  confirmDelete(name: string, onConfirm: () => void) {
    wx.showModal({
      title: "删除单位",
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
