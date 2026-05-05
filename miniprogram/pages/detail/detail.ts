import { House, ItemView, addOrUpdateItem, consumeItem, currentHouse, getItem } from "../../services/store";

function detailTextFor(item: ItemView): string {
  const parts = item.locationName === "其他" ? item.locationDetail : [item.locationName, ...item.locationDetail];
  const text = parts.filter(Boolean).join(" > ");
  if (!text && item.locationName !== "其他") return `${item.locationName} > `;
  return text;
}

function parseDetailText(text: string, locationName: string): string[] {
  const parts = text
    .split(">")
    .map((part) => part.trim())
    .filter(Boolean);
  if (locationName !== "其他" && parts[0] === locationName) return parts.slice(1);
  return parts;
}

Page({
  data: {
    itemId: "",
    item: null as ItemView | null,
    house: {} as House,
    locations: [] as House["locations"],
    locationIndex: 0,
    detailText: ""
  },

  onLoad(options: any) {
    this.setData({ itemId: options.id || "" });
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const house = currentHouse();
    const item = getItem(this.data.itemId);
    if (!item) {
      wx.showToast({ title: "物品不存在", icon: "none" });
      setTimeout(() => wx.navigateBack(), 600);
      return;
    }
    const locationIndex = Math.max(0, house.locations.findIndex((location) => location.id === item.locationId));
    this.setData({
      house,
      locations: house.locations,
      item,
      locationIndex,
      detailText: detailTextFor(item)
    });
  },

  goBill() {
    wx.navigateTo({ url: `/pages/bill/bill?id=${this.data.itemId}` });
  },

  goCycle() {
    wx.navigateTo({ url: `/pages/cycle/cycle?id=${this.data.itemId}` });
  },

  goEdit() {
    wx.navigateTo({ url: `/pages/edit/edit?id=${this.data.itemId}` });
  },

  goBack() {
    wx.navigateBack();
  },

  minusStock() {
    wx.showActionSheet({
      itemList: ["减少1个", "减少2个", "减少3个", "减少5个", "自定义数量"],
      success: (res: any) => {
        const fixed = [1, 2, 3, 5][res.tapIndex];
        if (fixed) {
          consumeItem(this.data.itemId, fixed);
          this.refresh();
          return;
        }
        wx.showModal({
          title: "减少库存",
          editable: true,
          placeholderText: "请输入减少数量",
          success: (modal: any) => {
            const quantity = Number(modal.content);
            if (modal.confirm && quantity > 0) {
              consumeItem(this.data.itemId, quantity);
              this.refresh();
            }
          }
        });
      }
    });
  },

  onNameInput(event: any) {
    const name = event.detail.value;
    addOrUpdateItem({ id: this.data.itemId, name });
    this.setData({ "item.name": name });
  },

  onLocationChange(event: any) {
    const locationIndex = Number(event.detail.value);
    const location = this.data.locations[locationIndex];
    if (!location || !this.data.item) return;
    const locationDetail = parseDetailText(this.data.detailText, this.data.item.locationName);
    addOrUpdateItem({ id: this.data.itemId, locationId: location.id, locationDetail });
    this.refresh();
  },

  onDetailInput(event: any) {
    if (!this.data.item) return;
    const detailText = event.detail.value;
    const locationDetail = parseDetailText(detailText, this.data.item.locationName);
    addOrUpdateItem({ id: this.data.itemId, locationDetail });
    this.setData({ detailText });
  },

  chooseImage() {
    wx.showActionSheet({
      itemList: ["拍照", "从相册上传"],
      success: (res: any) => {
        if (res.tapIndex === 0) {
          wx.authorize({
            scope: "scope.camera",
            success: () => (this as any).pickImage(["camera"]),
            fail: () => {
              wx.showModal({
                title: "需要相机权限",
                content: "请在设置中允许相机权限后再拍照。",
                success: (modal: any) => {
                  if (modal.confirm) wx.openSetting();
                }
              });
            }
          });
          return;
        }
        (this as any).pickImage(["album"]);
      }
    });
  },

  pickImage(sourceType: Array<"album" | "camera">) {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType,
      success: (res: any) => {
        const imageUrl = res.tempFiles[0].tempFilePath;
        addOrUpdateItem({ id: this.data.itemId, imageUrl });
        this.refresh();
      }
    });
  }
});
