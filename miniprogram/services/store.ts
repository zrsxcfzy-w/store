import {
  DeliveryPlatform,
  PLATFORM_DELIVERY_DAYS,
  addDays,
  compareIsoDate,
  daysBetween,
  estimateText,
  formatDotDate,
  todayIso
} from "../utils/date";

const STORE_KEY = "HOME_INVENTORY_STORE_V1";

export type SortMode = "priceAsc" | "priceDesc" | "timeDesc";

export interface LocationTag {
  id: string;
  name: string;
  color: string;
}

export interface CategoryTag {
  id: string;
  name: string;
}

export interface BillRecord {
  id: string;
  date: string;
  platform: DeliveryPlatform;
  price: number;
  quantity: number;
}

export interface InventoryItem {
  id: string;
  houseId: string;
  name: string;
  imageUrl: string;
  locationId: string;
  categoryId: string;
  locationDetail: string[];
  unit: string;
  manualConsumption: number;
  bills: BillRecord[];
}

export interface House {
  id: string;
  name: string;
  avatarUrl: string;
  locations: LocationTag[];
  categories: CategoryTag[];
  units: string[];
  items: InventoryItem[];
}

export interface InventoryStore {
  currentHouseId: string;
  hasReadManual: boolean;
  hasFinishedGuide: boolean;
  houses: House[];
}

export interface ItemView extends InventoryItem {
  locationName: string;
  locationColor: string;
  categoryName: string;
  displayLocation: string;
  fullLocationPath: string;
  stock: number;
  cycleDays: number;
  previousPurchaseDate: string;
  lastPurchaseDate: string;
  nextSuggestedDate: string;
  nextSuggestedText: string;
  priceRange: string;
}

export interface ShoppingListExport {
  count: number;
  summary: string;
  content: string;
}

function id(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

function defaultItemImage(name: string): string {
  if (name.includes("抽纸") || name.includes("纸")) return "/assets/item-tissue.png";
  if (name.includes("洗衣液")) return "/assets/item-detergent.png";
  if (name.includes("瓶") || name.includes("沐浴") || name.includes("洗手")) return "/assets/item-bottle.png";
  return "/assets/item-placeholder.png";
}

function seedStore(): InventoryStore {
  const houseId = "house_default";
  const locations: LocationTag[] = [
    { id: "loc_table", name: "桌子", color: "#f7a46f" },
    { id: "loc_closet", name: "衣柜", color: "#f2cf5b" },
    { id: "loc_kitchen", name: "厨房", color: "#a4d870" },
    { id: "loc_bath", name: "卫生间", color: "#7fc8e8" },
    { id: "loc_other", name: "其他", color: "#b79be6" }
  ];
  const categories: CategoryTag[] = [
    { id: "cat_wash", name: "洗漱用品" },
    { id: "cat_paper", name: "纸巾" },
    { id: "cat_food", name: "粮油调料" },
    { id: "cat_other", name: "其他" }
  ];
  return {
    currentHouseId: houseId,
    hasReadManual: false,
    hasFinishedGuide: false,
    houses: [
      {
        id: houseId,
        name: "望月小家",
        avatarUrl: "",
        locations,
        categories,
        units: ["件", "包", "瓶", "盒", "卷", "袋", "箱", "个"],
        items: [
          {
            id: "item_paper",
            houseId,
            name: "抽纸",
            imageUrl: "",
            locationId: "loc_other",
            categoryId: "cat_paper",
            locationDetail: ["阳台柜", "第二层"],
            unit: "包",
            manualConsumption: 4,
            bills: [
              { id: "bill_paper_1", date: "2026-02-06", platform: "京东", price: 18.8, quantity: 2 },
              { id: "bill_paper_2", date: "2026-03-03", platform: "淘宝", price: 12.9, quantity: 3 }
            ]
          },
          {
            id: "item_detergent",
            houseId,
            name: "洗衣液",
            imageUrl: "",
            locationId: "loc_bath",
            categoryId: "cat_wash",
            locationDetail: ["洗手台下方"],
            unit: "瓶",
            manualConsumption: 1,
            bills: [
              { id: "bill_detergent_1", date: "2026-04-08", platform: "京东", price: 29.9, quantity: 1 },
              { id: "bill_detergent_2", date: "2026-04-30", platform: "京东", price: 26.9, quantity: 2 }
            ]
          }
        ]
      }
    ]
  };
}

export function loadStore(): InventoryStore {
  const stored = wx.getStorageSync(STORE_KEY);
  if (stored) return stored;
  const seeded = seedStore();
  saveStore(seeded);
  return seeded;
}

export function saveStore(store: InventoryStore): void {
  wx.setStorageSync(STORE_KEY, store);
}

export function currentHouse(): House {
  const store = loadStore();
  return store.houses.find((house) => house.id === store.currentHouseId) || store.houses[0];
}

export function listHouses(): House[] {
  return loadStore().houses;
}

export function switchToHouse(houseId: string): void {
  const store = loadStore();
  if (!store.houses.some((house) => house.id === houseId)) return;
  store.currentHouseId = houseId;
  saveStore(store);
}

export function saveHouse(nextHouse: House): void {
  const store = loadStore();
  store.houses = store.houses.map((house) => (house.id === nextHouse.id ? nextHouse : house));
  saveStore(store);
}

export function setManualRead(): void {
  const store = loadStore();
  store.hasReadManual = true;
  saveStore(store);
}

export function setGuideFinished(): void {
  const store = loadStore();
  store.hasFinishedGuide = true;
  saveStore(store);
}

export function calculateItemView(item: InventoryItem, house = currentHouse()): ItemView {
  const location = house.locations.find((entry) => entry.id === item.locationId) || house.locations[0];
  const category = house.categories.find((entry) => entry.id === item.categoryId) || house.categories[0];
  const sortedBills = [...item.bills].sort((a, b) => compareIsoDate(a.date, b.date));
  const previousBill = sortedBills.length >= 2 ? sortedBills[sortedBills.length - 2] : undefined;
  const lastBill = sortedBills[sortedBills.length - 1];
  const cycleDays = previousBill && lastBill ? Math.max(1, daysBetween(previousBill.date, lastBill.date)) : 30;
  const deliveryDays = lastBill ? PLATFORM_DELIVERY_DAYS[lastBill.platform] : PLATFORM_DELIVERY_DAYS["其他平台"];
  const estimatedUseUpDate = lastBill ? addDays(lastBill.date, cycleDays) : addDays(todayIso(), 30);
  const nextSuggestedDate = addDays(estimatedUseUpDate, -deliveryDays);
  const totalBought = item.bills.reduce((sum, bill) => sum + Number(bill.quantity || 0), 0);
  const stock = Math.max(0, totalBought - Number(item.manualConsumption || 0));
  const prices = item.bills.map((bill) => Number(bill.price)).filter((price) => !Number.isNaN(price));
  const displayLocation = location.name === "其他" && item.locationDetail[0] ? item.locationDetail[0] : location.name;
  const fullLocationPath = [location.name, ...item.locationDetail].filter(Boolean).join(" > ");

  return {
    ...item,
    imageUrl: item.imageUrl || defaultItemImage(item.name),
    locationName: location.name,
    locationColor: location.color,
    categoryName: category.name,
    displayLocation,
    fullLocationPath,
    stock,
    cycleDays,
    previousPurchaseDate: previousBill?.date || "",
    lastPurchaseDate: lastBill?.date || "",
    nextSuggestedDate,
    nextSuggestedText: estimateText(nextSuggestedDate),
    priceRange: prices.length ? `${Math.min(...prices).toFixed(2)}~${Math.max(...prices).toFixed(2)}元` : "暂无价格"
  };
}

export function getItemViews(): ItemView[] {
  const house = currentHouse();
  return house.items.map((item) => calculateItemView(item, house)).sort(sortItems);
}

export function sortItems(a: ItemView, b: ItemView): number {
  if (a.stock !== b.stock) return a.stock - b.stock;
  const aExpired = a.nextSuggestedText === "已到期";
  const bExpired = b.nextSuggestedText === "已到期";
  if (aExpired !== bExpired) return aExpired ? -1 : 1;
  return compareIsoDate(a.nextSuggestedDate, b.nextSuggestedDate);
}

export function sortBillsByDateDescPriceDesc<
  T extends Pick<BillRecord, "date" | "price">
>(a: T, b: T): number {
  const dateOrder = compareIsoDate(b.date, a.date);

  if (dateOrder !== 0) {
    return dateOrder;
  }

  return Number(b.price || 0) - Number(a.price || 0);
}

export function getItem(itemId: string): ItemView | undefined {
  return getItemViews().find((item) => item.id === itemId);
}

export function addOrUpdateItem(input: Partial<InventoryItem>): string {
  const house = currentHouse();
  const existing = input.id ? house.items.find((item) => item.id === input.id) : undefined;
  const nextId = existing?.id || id("item");
  const nextItem: InventoryItem = {
    id: nextId,
    houseId: house.id,
    name: input.name ?? existing?.name ?? "新物品",
    imageUrl: input.imageUrl ?? existing?.imageUrl ?? "",
    locationId: input.locationId ?? existing?.locationId ?? house.locations[0].id,
    categoryId: input.categoryId ?? existing?.categoryId ?? house.categories[0].id,
    locationDetail: input.locationDetail ?? existing?.locationDetail ?? [],
    unit: input.unit ?? existing?.unit ?? house.units[0],
    manualConsumption: input.manualConsumption ?? existing?.manualConsumption ?? 0,
    bills: input.bills ?? existing?.bills ?? []
  };
  house.items = existing ? house.items.map((item) => (item.id === nextId ? nextItem : item)) : [nextItem, ...house.items];
  saveHouse(house);
  return nextId;
}

export function deleteItem(itemId: string): void {
  const house = currentHouse();
  house.items = house.items.filter((item) => item.id !== itemId);
  saveHouse(house);
}

export function consumeItem(itemId: string, quantity = 1): void {
  const house = currentHouse();
  house.items = house.items.map((item) => {
    if (item.id !== itemId) return item;
    return { ...item, manualConsumption: Number(item.manualConsumption || 0) + quantity };
  });
  saveHouse(house);
}

export function addBill(itemId: string, bill: Omit<BillRecord, "id">): void {
  const house = currentHouse();
  house.items = house.items.map((item) => {
    if (item.id !== itemId) return item;
    return { ...item, bills: [{ ...bill, id: id("bill") }, ...item.bills] };
  });
  saveHouse(house);
}

export function deleteBill(billId: string): void {
  const house = currentHouse();
  house.items = house.items.map((item) => ({
    ...item,
    bills: item.bills.filter((bill) => bill.id !== billId)
  }));
  saveHouse(house);
}

export function updateTagName(kind: "location" | "category", tagId: string, name: string): void {
  const house = currentHouse();
  if (kind === "location") {
    house.locations = house.locations.map((tag) => (tag.id === tagId ? { ...tag, name } : tag));
  } else {
    house.categories = house.categories.map((tag) => (tag.id === tagId ? { ...tag, name } : tag));
  }
  saveHouse(house);
}

export function updateHouseName(name: string): void {
  const house = currentHouse();
  house.name = name;
  saveHouse(house);
}

export function updateAvatar(avatarUrl: string): void {
  const house = currentHouse();
  house.avatarUrl = avatarUrl;
  saveHouse(house);
}

export function switchToNewHouse(): void {
  const store = loadStore();
  const houseId = id("house");
  const source = currentHouse();
  const nextHouse: House = {
    id: houseId,
    name: `新房子${store.houses.length + 1}`,
    avatarUrl: "",
    locations: source.locations.map((tag) => ({ ...tag, id: id("loc") })),
    categories: source.categories.map((tag) => ({ ...tag, id: id("cat") })),
    units: [...source.units],
    items: []
  };
  store.currentHouseId = houseId;
  store.houses = [...store.houses, nextHouse];
  saveStore(store);
}

export function getAllBillViews(): Array<
  BillRecord & {
    itemName: string;
    unit: string;
    displayDate: string;
  }
> {
  const house = currentHouse();

  return house.items
    .flatMap((item) =>
      item.bills.map((bill) => ({
        ...bill,
        itemName: item.name,
        unit: item.unit,
        displayDate: formatBillDate(bill.date)
      }))
    )
    .sort(sortBillsByDateDescPriceDesc);
}

function getShoppingListItems(): ItemView[] {
  return getItemViews()
    .filter((item) => item.stock <= 2 || item.nextSuggestedText === "已到期" || daysBetween(todayIso(), item.nextSuggestedDate) <= 5)
    .sort(sortItems);
}

export function exportShoppingList(): ShoppingListExport {
  const list = getShoppingListItems();
  if (!list.length) {
    return {
      count: 0,
      summary: "当前没有需要购买的物品",
      content: "当前没有需要购买的物品"
    };
  }
  const summary = `当前需要购买${list.length}件物品`;
  const details = list.map(
    (item, index) =>
      `${index + 1}. ${item.name} 剩余库存: ${item.stock}${item.unit} 预计购买: ${item.nextSuggestedText} 位置: ${item.fullLocationPath}`
  );
  return {
    count: list.length,
    summary,
    content: [summary, ...details].join("\n")
  };
}

export function reminderListText(): string {
  const list = getItemViews()
    .filter((item) => item.stock <= 1 || item.nextSuggestedText === "已到期" || daysBetween(todayIso(), item.nextSuggestedDate) <= 3)
    .sort(sortItems);
  return list
    .map((item, index) => `(${index + 1}) ${item.name} 剩余库存: ${item.stock} 预计购买时间: ${item.nextSuggestedText}`)
    .join("\n");
}

export function formatBillDate(isoDate: string): string {
  return formatDotDate(isoDate);
}
