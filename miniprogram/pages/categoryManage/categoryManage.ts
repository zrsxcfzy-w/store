import { currentHouse, deleteCategory, moveCategory, upsertCategory } from "../../services/store";

Page({
  data: {
    categories: [] as Array<{ id: string; name: string; count: number }>
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const house = currentHouse();
    const categories = house.categories.map((category) => ({
      ...category,
      count: house.items.filter((item) => item.categoryId === category.id).length
    }));
    this.setData({ categories });
  },

  addCategory() {
    this.promptName("新增分类", "", (name) => {
      upsertCategory({ name });
      this.refresh();
    });
  },

  editCategory(event: any) {
    const { id, name } = event.currentTarget.dataset;
    this.promptName("修改分类名称", name, (nextName) => {
      upsertCategory({ id, name: nextName });
      this.refresh();
    });
  },

  moveCategory(event: any) {
    moveCategory(event.currentTarget.dataset.id, event.currentTarget.dataset.direction);
    this.refresh();
  },

  removeCategory(event: any) {
    const { id, name } = event.currentTarget.dataset;
    const count = Number(event.currentTarget.dataset.count || 0);
    if (this.data.categories.length <= 1) {
      wx.showToast({ title: "至少保留一个分类", icon: "none" });
      return;
    }
    if (!count) {
      this.confirmDelete(name, () => {
        deleteCategory(id);
        this.refresh();
      });
      return;
    }
    const candidates = this.data.categories.filter((category) => category.id !== id);
    wx.showActionSheet({
      itemList: candidates.map((category) => `迁移到：${category.name}`),
      success: (res) => {
        const replacement = candidates[res.tapIndex];
        if (!replacement) return;
        deleteCategory(id, replacement.id);
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
      title: "删除分类",
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
