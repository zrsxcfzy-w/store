const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const COLLECTION = "storeBackups";
const MAX_BACKUPS = 10;

function summarize(snapshot) {
  if (snapshot.summary) return snapshot.summary;
  const houses = Array.isArray(snapshot.houses) ? snapshot.houses : [];
  const itemCount = houses.reduce((sum, house) => sum + (house.items || []).length, 0);
  const billCount = houses.reduce(
    (sum, house) => sum + (house.items || []).reduce((itemSum, item) => itemSum + (item.bills || []).length, 0),
    0
  );
  const current = houses.find((house) => house.id === snapshot.currentHouseId) || houses[0] || {};
  return {
    houseCount: houses.length,
    itemCount,
    billCount,
    currentHouseName: current.name || "未命名仓库"
  };
}

async function pruneBackups(openid) {
  const result = await db.collection(COLLECTION).where({ _openid: openid }).orderBy("createdAt", "desc").get();
  const stale = result.data.slice(MAX_BACKUPS);
  for (const backup of stale) {
    await db.collection(COLLECTION).doc(backup._id).remove();
  }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const action = event.action;

  if (action === "create") {
    const snapshot = event.snapshot;
    if (!snapshot || snapshot.schemaVersion !== 1 || !Array.isArray(snapshot.houses)) {
      throw new Error("Invalid backup snapshot");
    }
    const createdAt = snapshot.createdAt || new Date().toISOString();
    const summary = summarize(snapshot);
    const result = await db.collection(COLLECTION).add({
      data: {
        _openid: OPENID,
        createdAt,
        appVersion: snapshot.appVersion || "1.0.0",
        summary,
        snapshot: {
          ...snapshot,
          createdAt,
          summary
        }
      }
    });
    await pruneBackups(OPENID);
    return { id: result._id, createdAt, summary };
  }

  if (action === "list") {
    const result = await db.collection(COLLECTION).where({ _openid: OPENID }).orderBy("createdAt", "desc").get();
    return {
      backups: result.data.map((backup) => ({
        _id: backup._id,
        createdAt: backup.createdAt,
        appVersion: backup.appVersion,
        summary: backup.summary
      }))
    };
  }

  if (action === "get") {
    const result = await db.collection(COLLECTION).doc(event.id).get();
    if (!result.data || result.data._openid !== OPENID) throw new Error("Backup not found");
    return { snapshot: result.data.snapshot };
  }

  if (action === "delete") {
    const result = await db.collection(COLLECTION).doc(event.id).get();
    if (!result.data || result.data._openid !== OPENID) throw new Error("Backup not found");
    await db.collection(COLLECTION).doc(event.id).remove();
    return { ok: true };
  }

  throw new Error("Unknown action");
};
