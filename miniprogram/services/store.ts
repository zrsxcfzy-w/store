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
const SAFETY_BACKUP_KEY = "HOME_INVENTORY_SAFETY_BACKUPS_V1";
const BACKUP_SCHEMA_VERSION = 1;
const APP_VERSION = "1.0.0";
const LOCATION_PALETTE_VERSION = 2;

export type SortMode = "priceAsc" | "priceDesc" | "timeDesc";

export const LOCATION_COLOR_PALETTE = [
  "#d991bc",
  "#ee88a6",
  "#f2b06f",
  "#dbe67a",
  "#7bdc31",
  "#b7e7b8",
  "#93dccd",
  "#73c8d2",
  "#8ecfe1",
  "#b8d7eb",
  "#9fa9df",
  "#c3a3e6"
];

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
  platformDetail?: string;
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

export type OnboardingHintKey = "inventory" | "bills" | "profile" | "cycle" | "backup";

export interface OnboardingHints {
  inventorySeen: boolean;
  billsSeen: boolean;
  profileSeen: boolean;
  cycleSeen: boolean;
  backupSeen: boolean;
}

export interface OnboardingState {
  coreFinished: boolean;
  skippedCore: boolean;
  coreStep: number;
  hints: OnboardingHints;
}

export interface InventoryStore {
  currentHouseId: string;
  hasReadManual?: boolean;
  hasFinishedGuide?: boolean;
  locationPaletteVersion?: number;
  onboarding: OnboardingState;
  houses: House[];
  deletedHouses?: House[];
}

export interface BackupSummary {
  houseCount: number;
  itemCount: number;
  billCount: number;
  currentHouseName: string;
}

export interface BackupSnapshot {
  schemaVersion: number;
  createdAt: string;
  appVersion: string;
  currentHouseId: string;
  houses: House[];
  deletedHouses?: House[];
  summary: BackupSummary;
}

export type RestoreMode = "newHouse" | "overwriteCurrent";

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
    { id: "loc_table", name: "桌子", color: LOCATION_COLOR_PALETTE[0] },
    { id: "loc_closet", name: "衣柜", color: LOCATION_COLOR_PALETTE[1] },
    { id: "loc_kitchen", name: "厨房", color: LOCATION_COLOR_PALETTE[2] },
    { id: "loc_bath", name: "卫生间", color: LOCATION_COLOR_PALETTE[3] },
    { id: "loc_other", name: "其他", color: LOCATION_COLOR_PALETTE[4] }
  ];
  const categories: CategoryTag[] = [
    { id: "cat_wash", name: "洗漱用品" },
    { id: "cat_paper", name: "纸巾" },
    { id: "cat_food", name: "粮油调料" },
    { id: "cat_other", name: "其他" }
  ];
  return {
    currentHouseId: houseId,
    onboarding: defaultOnboarding(),
    houses: [
      {
        id: houseId,
        name: "望月小家",
        avatarUrl: "",
        locations,
        categories,
        units: ["件", "包", "瓶", "盒", "卷", "袋", "箱", "个", "斤", "kg", "ml", "L"],
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

function defaultOnboarding(): OnboardingState {
  return {
    coreFinished: false,
    skippedCore: false,
    coreStep: 0,
    hints: {
      inventorySeen: false,
      billsSeen: false,
      profileSeen: false,
      cycleSeen: false,
      backupSeen: false
    }
  };
}

function applyLocationPalette(house: House): House {
  return {
    ...house,
    locations: house.locations.map((location, index) => ({
      ...location,
      color: LOCATION_COLOR_PALETTE[index % LOCATION_COLOR_PALETTE.length]
    }))
  };
}

function normalizeOnboarding(store: InventoryStore): InventoryStore {
  const defaults = defaultOnboarding();
  const legacyFinished = store.hasFinishedGuide === true;
  const legacySkipped = store.hasReadManual === true && store.hasFinishedGuide !== true;
  const onboarding = store.onboarding || defaults;
  return {
    ...store,
    onboarding: {
      coreFinished: onboarding.coreFinished || legacyFinished,
      skippedCore: onboarding.skippedCore || legacySkipped,
      coreStep: Number(onboarding.coreStep || 0),
      hints: {
        ...defaults.hints,
        ...(onboarding.hints || {})
      }
    }
  };
}

function normalizeStore(store: InventoryStore): InventoryStore {
  const onboardingNormalized = normalizeOnboarding(store);
  const shouldApplyPalette = onboardingNormalized.locationPaletteVersion !== LOCATION_PALETTE_VERSION;
  const houses = shouldApplyPalette
    ? onboardingNormalized.houses.map(applyLocationPalette)
    : onboardingNormalized.houses;
  const deletedHouses = shouldApplyPalette
    ? (onboardingNormalized.deletedHouses || []).map(applyLocationPalette)
    : onboardingNormalized.deletedHouses || [];
  const currentHouseId = houses.some((house) => house.id === onboardingNormalized.currentHouseId)
    ? onboardingNormalized.currentHouseId
    : houses[0]?.id || onboardingNormalized.currentHouseId;

  return {
    ...onboardingNormalized,
    locationPaletteVersion: LOCATION_PALETTE_VERSION,
    currentHouseId,
    houses,
    deletedHouses
  };
}

export function loadStore(): InventoryStore {
  const stored = wx.getStorageSync(STORE_KEY);
  if (stored) {
    const normalized = normalizeStore(stored);
    if (JSON.stringify(stored) !== JSON.stringify(normalized)) saveStore(normalized);
    return normalized;
  }
  const seeded = seedStore();
  saveStore(seeded);
  return seeded;
}

export function saveStore(store: InventoryStore): void {
  wx.setStorageSync(STORE_KEY, {
    ...store,
    locationPaletteVersion: store.locationPaletteVersion || LOCATION_PALETTE_VERSION,
    deletedHouses: store.deletedHouses || []
  });
}

export function currentHouse(): House {
  const store = loadStore();
  return store.houses.find((house) => house.id === store.currentHouseId) || store.houses[0];
}

export function listHouses(): House[] {
  return loadStore().houses;
}

export function listDeletedHouses(): House[] {
  return loadStore().deletedHouses || [];
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
  store.onboarding.skippedCore = true;
  saveStore(store);
}

export function setGuideFinished(): void {
  const store = loadStore();
  store.onboarding.coreFinished = true;
  store.onboarding.skippedCore = false;
  store.onboarding.coreStep = 0;
  saveStore(store);
}

export function resetManualAndGuide(): void {
  const store = loadStore();
  store.onboarding = defaultOnboarding();
  saveStore(store);
}

export function getOnboarding(): OnboardingState {
  return loadStore().onboarding;
}

export function setCoreOnboardingStep(step: number): void {
  const store = loadStore();
  store.onboarding.coreStep = Math.max(0, step);
  saveStore(store);
}

export function skipCoreOnboarding(): void {
  const store = loadStore();
  store.onboarding.skippedCore = true;
  store.onboarding.coreStep = 0;
  saveStore(store);
}

export function finishCoreOnboarding(): void {
  setGuideFinished();
}

function hintFlagName(key: OnboardingHintKey): keyof OnboardingHints {
  const map: Record<OnboardingHintKey, keyof OnboardingHints> = {
    inventory: "inventorySeen",
    bills: "billsSeen",
    profile: "profileSeen",
    cycle: "cycleSeen",
    backup: "backupSeen"
  };
  return map[key];
}

export function shouldShowOnboardingHint(key: OnboardingHintKey): boolean {
  const flag = hintFlagName(key);
  return !loadStore().onboarding.hints[flag];
}

export function markOnboardingHintSeen(key: OnboardingHintKey): void {
  const store = loadStore();
  store.onboarding.hints[hintFlagName(key)] = true;
  saveStore(store);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function backupSummary(store: InventoryStore): BackupSummary {
  const itemCount = store.houses.reduce((sum, house) => sum + house.items.length, 0);
  const billCount = store.houses.reduce(
    (sum, house) => sum + house.items.reduce((itemSum, item) => itemSum + item.bills.length, 0),
    0
  );
  const current = store.houses.find((house) => house.id === store.currentHouseId) || store.houses[0];
  return {
    houseCount: store.houses.length,
    itemCount,
    billCount,
    currentHouseName: current?.name || "未命名仓库"
  };
}

export function createBackupSnapshot(): BackupSnapshot {
  const store = loadStore();
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    currentHouseId: store.currentHouseId,
    houses: clone(store.houses),
    deletedHouses: clone(store.deletedHouses || []),
    summary: backupSummary(store)
  };
}

export function parseBackupSnapshot(text: string): BackupSnapshot {
  const snapshot = JSON.parse(text) as BackupSnapshot;
  if (!snapshot || snapshot.schemaVersion !== BACKUP_SCHEMA_VERSION || !Array.isArray(snapshot.houses)) {
    throw new Error("备份文件格式不正确");
  }
  if (!snapshot.houses.length) {
    throw new Error("备份中没有仓库数据");
  }
  return {
    ...snapshot,
    deletedHouses: snapshot.deletedHouses || [],
    summary: snapshot.summary || backupSummary({
      currentHouseId: snapshot.currentHouseId,
      hasReadManual: true,
      hasFinishedGuide: true,
      onboarding: defaultOnboarding(),
      houses: snapshot.houses,
      deletedHouses: snapshot.deletedHouses || []
    })
  };
}

function cloneHouseAsNew(source: House): House {
  const houseId = id("house");
  const locationIdMap: Record<string, string> = {};
  const categoryIdMap: Record<string, string> = {};
  const locations = source.locations.map((location) => {
    const nextId = id("loc");
    locationIdMap[location.id] = nextId;
    return { ...location, id: nextId };
  });
  const categories = source.categories.map((category) => {
    const nextId = id("cat");
    categoryIdMap[category.id] = nextId;
    return { ...category, id: nextId };
  });
  return {
    ...source,
    id: houseId,
    name: `${source.name || "未命名仓库"}(导入)`,
    locations,
    categories,
    units: [...source.units],
    items: source.items.map((item) => ({
      ...item,
      id: id("item"),
      houseId,
      locationId: locationIdMap[item.locationId] || locations[0]?.id || "",
      categoryId: categoryIdMap[item.categoryId] || categories[0]?.id || "",
      bills: item.bills.map((bill) => ({ ...bill, id: id("bill") }))
    }))
  };
}

function snapshotCurrentHouse(snapshot: BackupSnapshot): House {
  return snapshot.houses.find((house) => house.id === snapshot.currentHouseId) || snapshot.houses[0];
}

function saveSafetyBackup(snapshot: BackupSnapshot): void {
  const backups = wx.getStorageSync(SAFETY_BACKUP_KEY) || [];
  wx.setStorageSync(SAFETY_BACKUP_KEY, [snapshot, ...backups].slice(0, 5));
}

export function restoreFromSnapshot(snapshot: BackupSnapshot, mode: RestoreMode): void {
  const parsed = parseBackupSnapshot(JSON.stringify(snapshot));
  const store = loadStore();
  const importedDeletedHouses = (parsed.deletedHouses || []).map(cloneHouseAsNew);
  if (mode === "newHouse") {
    const sourceCurrentId = parsed.currentHouseId;
    const importedHouses = parsed.houses.map(cloneHouseAsNew);
    const currentIndex = parsed.houses.findIndex((house) => house.id === sourceCurrentId);
    store.houses = [...store.houses, ...importedHouses];
    store.deletedHouses = [...(store.deletedHouses || []), ...importedDeletedHouses];
    store.currentHouseId = importedHouses[Math.max(0, currentIndex)]?.id || importedHouses[0].id;
    saveStore(store);
    return;
  }

  saveSafetyBackup(createBackupSnapshot());
  const source = clone(snapshotCurrentHouse(parsed));
  const current = currentHouse();
  const nextHouse: House = {
    ...source,
    id: current.id,
    name: source.name || current.name,
    avatarUrl: source.avatarUrl || current.avatarUrl,
    items: source.items.map((item) => ({ ...item, houseId: current.id }))
  };
  store.houses = store.houses.map((house) => (house.id === current.id ? nextHouse : house));
  store.deletedHouses = [...(store.deletedHouses || []), ...importedDeletedHouses];
  store.currentHouseId = current.id;
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

export function deleteBills(billIds: string[]): void {
  const ids = new Set(billIds);
  if (!ids.size) return;
  const house = currentHouse();
  house.items = house.items.map((item) => ({
    ...item,
    bills: item.bills.filter((bill) => !ids.has(bill.id))
  }));
  saveHouse(house);
}

export function deleteBillsByDate(date: string): void {
  if (!date) return;
  const house = currentHouse();
  house.items = house.items.map((item) => ({
    ...item,
    bills: item.bills.filter((bill) => bill.date !== date)
  }));
  saveHouse(house);
}

export function deleteBillsByDates(dates: string[]): void {
  const selectedDates = new Set(dates);
  if (!selectedDates.size) return;
  const house = currentHouse();
  house.items = house.items.map((item) => ({
    ...item,
    bills: item.bills.filter((bill) => !selectedDates.has(bill.date))
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

export function upsertCategory(input: Partial<CategoryTag>): string {
  const house = currentHouse();
  const name = (input.name || "").trim();
  if (!name) return "";
  const existing = input.id ? house.categories.find((tag) => tag.id === input.id) : undefined;
  const duplicate = house.categories.find((tag) => tag.name === name && tag.id !== input.id);
  if (duplicate) return duplicate.id;
  if (existing) {
    house.categories = house.categories.map((tag) => (tag.id === existing.id ? { ...tag, name } : tag));
    saveHouse(house);
    return existing.id;
  }
  const categoryId = id("cat");
  house.categories = [...house.categories, { id: categoryId, name }];
  saveHouse(house);
  return categoryId;
}

export function mergeCategory(sourceId: string, targetId: string): void {
  if (!sourceId || !targetId || sourceId === targetId) return;
  const house = currentHouse();
  house.items = house.items.map((item) => (item.categoryId === sourceId ? { ...item, categoryId: targetId } : item));
  house.categories = house.categories.filter((tag) => tag.id !== sourceId);
  saveHouse(house);
}

export function deleteCategory(categoryId: string, replacementId?: string): boolean {
  const house = currentHouse();
  const used = house.items.some((item) => item.categoryId === categoryId);
  if (used && !replacementId) return false;
  if (used && replacementId) {
    mergeCategory(categoryId, replacementId);
    return true;
  }
  house.categories = house.categories.filter((tag) => tag.id !== categoryId);
  saveHouse(house);
  return true;
}

export function upsertLocation(input: Partial<LocationTag>): string {
  const house = currentHouse();
  const name = (input.name || "").trim();
  if (!name) return "";
  const color = input.color || "#7fc8e8";
  const existing = input.id ? house.locations.find((tag) => tag.id === input.id) : undefined;
  const duplicate = house.locations.find((tag) => tag.name === name && tag.id !== input.id);
  if (duplicate) return duplicate.id;
  if (existing) {
    house.locations = house.locations.map((tag) => (tag.id === existing.id ? { ...tag, name, color } : tag));
    saveHouse(house);
    return existing.id;
  }
  const locationId = id("loc");
  house.locations = [...house.locations, { id: locationId, name, color }];
  saveHouse(house);
  return locationId;
}

export function mergeLocation(sourceId: string, targetId: string): void {
  if (!sourceId || !targetId || sourceId === targetId) return;
  const house = currentHouse();
  house.items = house.items.map((item) => (item.locationId === sourceId ? { ...item, locationId: targetId } : item));
  house.locations = house.locations.filter((tag) => tag.id !== sourceId);
  saveHouse(house);
}

export function deleteLocation(locationId: string, replacementId?: string): boolean {
  const house = currentHouse();
  const used = house.items.some((item) => item.locationId === locationId);
  if (used && !replacementId) return false;
  if (used && replacementId) {
    mergeLocation(locationId, replacementId);
    return true;
  }
  house.locations = house.locations.filter((tag) => tag.id !== locationId);
  saveHouse(house);
  return true;
}

export function moveCategory(categoryId: string, direction: "up" | "down"): void {
  const house = currentHouse();
  const index = house.categories.findIndex((tag) => tag.id === categoryId);
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || nextIndex < 0 || nextIndex >= house.categories.length) return;
  const categories = [...house.categories];
  [categories[index], categories[nextIndex]] = [categories[nextIndex], categories[index]];
  house.categories = categories;
  saveHouse(house);
}

export function moveLocation(locationId: string, direction: "up" | "down"): void {
  const house = currentHouse();
  const index = house.locations.findIndex((tag) => tag.id === locationId);
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || nextIndex < 0 || nextIndex >= house.locations.length) return;
  const locations = [...house.locations];
  [locations[index], locations[nextIndex]] = [locations[nextIndex], locations[index]];
  house.locations = locations;
  saveHouse(house);
}

export function upsertUnit(unit: string, previousUnit?: string): string {
  const house = currentHouse();
  const name = unit.trim();
  if (!name) return "";
  if (previousUnit && previousUnit !== name) {
    house.items = house.items.map((item) => (item.unit === previousUnit ? { ...item, unit: name } : item));
    house.units = house.units.map((entry) => (entry === previousUnit ? name : entry));
  } else if (!house.units.includes(name)) {
    house.units = [...house.units, name];
  }
  house.units = Array.from(new Set(house.units));
  saveHouse(house);
  return name;
}

export function replaceUnit(sourceUnit: string, targetUnit: string): void {
  if (!sourceUnit || !targetUnit || sourceUnit === targetUnit) return;
  const house = currentHouse();
  house.items = house.items.map((item) => (item.unit === sourceUnit ? { ...item, unit: targetUnit } : item));
  house.units = house.units.filter((unit) => unit !== sourceUnit);
  if (!house.units.includes(targetUnit)) house.units = [...house.units, targetUnit];
  saveHouse(house);
}

export function deleteUnit(unit: string, replacementUnit?: string): boolean {
  const house = currentHouse();
  const used = house.items.some((item) => item.unit === unit);
  if (used && !replacementUnit) return false;
  if (used && replacementUnit) {
    replaceUnit(unit, replacementUnit);
    return true;
  }
  house.units = house.units.filter((entry) => entry !== unit);
  saveHouse(house);
  return true;
}

export function moveUnit(unit: string, direction: "up" | "down"): void {
  const house = currentHouse();
  const index = house.units.findIndex((entry) => entry === unit);
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || nextIndex < 0 || nextIndex >= house.units.length) return;
  const units = [...house.units];
  [units[index], units[nextIndex]] = [units[nextIndex], units[index]];
  house.units = units;
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

function createEmptyHouseFromSource(source: House, name: string): House {
  const houseId = id("house");
  return {
    id: houseId,
    name,
    avatarUrl: "",
    locations: source.locations.map((tag, index) => ({
      ...tag,
      id: id("loc"),
      color: LOCATION_COLOR_PALETTE[index % LOCATION_COLOR_PALETTE.length]
    })),
    categories: source.categories.map((tag) => ({ ...tag, id: id("cat") })),
    units: [...source.units],
    items: []
  };
}

export function switchToNewHouse(): void {
  const store = loadStore();
  const source = currentHouse();
  const nextHouse = createEmptyHouseFromSource(source, `新房子${store.houses.length + 1}`);
  store.currentHouseId = nextHouse.id;
  store.houses = [...store.houses, nextHouse];
  saveStore(store);
}

export function deleteCurrentHouse(): void {
  const store = loadStore();
  const current = store.houses.find((house) => house.id === store.currentHouseId) || store.houses[0];
  if (!current) return;

  const remainingHouses = store.houses.filter((house) => house.id !== current.id);
  const deletedHouses = [current, ...(store.deletedHouses || [])];
  if (remainingHouses.length) {
    store.houses = remainingHouses;
    store.currentHouseId = remainingHouses[0].id;
  } else {
    const nextHouse = createEmptyHouseFromSource(current, "新房子1");
    store.houses = [nextHouse];
    store.currentHouseId = nextHouse.id;
  }
  store.deletedHouses = deletedHouses;
  saveStore(store);
}

export function restoreDeletedHouse(houseId: string): boolean {
  const store = loadStore();
  const deletedHouses = store.deletedHouses || [];
  const target = deletedHouses.find((house) => house.id === houseId);
  if (!target) return false;

  const restoredHouse = store.houses.some((house) => house.id === target.id) ? cloneHouseAsNew(target) : target;
  store.houses = [restoredHouse, ...store.houses];
  store.deletedHouses = deletedHouses.filter((house) => house.id !== houseId);
  store.currentHouseId = restoredHouse.id;
  saveStore(store);
  return true;
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
