import { House, InventoryItem, addOrUpdateItem, currentHouse, getItem } from "../../services/store";

Page({
  data: {
    itemId: "",
    house: {} as House,
    locationIndex: 0,
    categoryIndex: 0,
    unitIndex: 0,
    locationName: "",
    categoryName: "",
    unitName: "",
    form: {
      name: "",
      imageUrl: "",
      locationDetailText: "",
      manualConsumption: 0
    }
  },

  onLoad(options: any) {
    this.setData({ itemId: options.id || "" });
  },

  onShow() {
    const house = currentHouse();
    const item = this.data.itemId ? getItem(this.data.itemId) : undefined;
    const locationIndex = item ? Math.max(0, house.locations.findIndex((tag) => tag.id === item.locationId)) : 0;
    const categoryIndex = item ? Math.max(0, house.categories.findIndex((tag) => tag.id === item.categoryId)) : 0;
    const unitIndex = item ? Math.max(0, house.units.findIndex((unit) => unit === item.unit)) : 0;
    this.setData({
      house,
      locationIndex,
      categoryIndex,
      unitIndex,
      locationName: house.locations[locationIndex]?.name || "",
      categoryName: house.categories[categoryIndex]?.name || "",
      unitName: house.units[unitIndex] || "",
      form: {
        name: item?.name || "",
        imageUrl: item?.imageUrl || "",
        locationDetailText: item?.locationDetail?.join(" > ") || "",
        manualConsumption: item?.manualConsumption || 0
      }
    });
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res: any) => {
        this.setData({ "form.imageUrl": res.tempFiles[0].tempFilePath });
      }
    });
  },

  onNameInput(event: any) {
    this.setData({ "form.name": event.detail.value });
  },

  onLocationChange(event: any) {
    const locationIndex = Number(event.detail.value);
    this.setData({
      locationIndex,
      locationName: this.data.house.locations[locationIndex].name
    });
  },

  onCategoryChange(event: any) {
    const categoryIndex = Number(event.detail.value);
    this.setData({
      categoryIndex,
      categoryName: this.data.house.categories[categoryIndex].name
    });
  },

  onUnitChange(event: any) {
    const unitIndex = Number(event.detail.value);
    this.setData({
      unitIndex,
      unitName: this.data.house.units[unitIndex]
    });
  },

  onDetailInput(event: any) {
    this.setData({ "form.locationDetailText": event.detail.value });
  },

  save() {
    const house = this.data.house;
    const name = this.data.form.name.trim();
    if (!name) {
      wx.showToast({ title: "请填写物品名称", icon: "none" });
      return;
    }
    const existing = this.data.itemId ? getItem(this.data.itemId) : undefined;
    const input: Partial<InventoryItem> = {
      id: this.data.itemId || undefined,
      name,
      imageUrl: this.data.form.imageUrl,
      locationId: house.locations[this.data.locationIndex].id,
      categoryId: house.categories[this.data.categoryIndex].id,
      unit: house.units[this.data.unitIndex],
      locationDetail: this.data.form.locationDetailText
        .split(/[>＞,，/]/)
        .map((part: string) => part.trim())
        .filter(Boolean),
      manualConsumption: existing?.manualConsumption || 0,
      bills: existing?.bills || []
    };
    const itemId = addOrUpdateItem(input);
    wx.showToast({ title: "已保存" });
    setTimeout(() => {
      wx.redirectTo({ url: `/pages/detail/detail?id=${itemId}` });
    }, 400);
  }
});
