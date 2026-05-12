import {
  BackupSnapshot,
  RestoreMode,
  markOnboardingHintSeen,
  parseBackupSnapshot,
  restoreFromSnapshot,
  shouldShowOnboardingHint
} from "../../services/store";

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => `${value}`.padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function previewFromSnapshot(snapshot: BackupSnapshot) {
  return {
    createdAtText: formatDateTime(snapshot.createdAt),
    currentHouseName: snapshot.summary.currentHouseName,
    houseCount: snapshot.summary.houseCount,
    itemCount: snapshot.summary.itemCount,
    billCount: snapshot.summary.billCount
  };
}

Page({
  data: {
    previewVisible: false,
    preview: {},
    snapshot: null as BackupSnapshot | null,
    cloudLoading: false,
    cloudBackups: [] as any[],
    hintVisible: false
  },

  onShow() {
    this.loadCloudBackups();
    if (shouldShowOnboardingHint("backup")) this.setData({ hintVisible: true });
  },

  chooseLocalFile() {
    wx.chooseMessageFile({
      count: 1,
      type: "file",
      success: (res: any) => {
        const file = res.tempFiles[0];
        wx.getFileSystemManager().readFile({
          filePath: file.path,
          encoding: "utf8",
          success: (readRes: any) => this.previewSnapshotText(String(readRes.data || "")),
          fail: () => wx.showToast({ title: "读取备份失败", icon: "none" })
        });
      }
    });
  },

  importFromClipboard() {
    wx.getClipboardData({
      success: (res) => this.previewSnapshotText(res.data),
      fail: () => wx.showToast({ title: "读取剪贴板失败", icon: "none" })
    });
  },

  previewSnapshotText(text: string) {
    try {
      const snapshot = parseBackupSnapshot(text);
      this.setData({
        snapshot,
        preview: previewFromSnapshot(snapshot),
        previewVisible: true
      });
    } catch (error) {
      wx.showToast({ title: "备份格式不正确", icon: "none" });
    }
  },

  loadCloudBackups() {
    if (!wx.cloud) return;
    this.setData({ cloudLoading: true });
    wx.cloud.callFunction({
      name: "storeBackup",
      data: { action: "list" },
      success: (res: any) => {
        const backups = (res.result?.backups || []).map((backup: any) => ({
          ...backup,
          createdAtText: formatDateTime(backup.createdAt)
        }));
        this.setData({ cloudBackups: backups });
      },
      complete: () => this.setData({ cloudLoading: false })
    });
  },

  previewCloudBackup(event: any) {
    const id = event.currentTarget.dataset.id;
    wx.cloud.callFunction({
      name: "storeBackup",
      data: { action: "get", id },
      success: (res: any) => {
        const snapshot = res.result?.snapshot;
        if (!snapshot) {
          wx.showToast({ title: "备份不存在", icon: "none" });
          return;
        }
        this.setData({
          snapshot,
          preview: previewFromSnapshot(snapshot),
          previewVisible: true
        });
      },
      fail: () => wx.showToast({ title: "读取云备份失败", icon: "none" })
    });
  },

  deleteCloudBackup(event: any) {
    const id = event.currentTarget.dataset.id;
    wx.showModal({
      title: "删除云备份",
      content: "确定删除这份云端备份吗？",
      confirmText: "删除",
      confirmColor: "#e64340",
      success: (res) => {
        if (!res.confirm) return;
        wx.cloud.callFunction({
          name: "storeBackup",
          data: { action: "delete", id },
          success: () => {
            wx.showToast({ title: "已删除" });
            this.loadCloudBackups();
          },
          fail: () => wx.showToast({ title: "删除失败", icon: "none" })
        });
      }
    });
  },

  restoreAsNewHouse() {
    this.confirmRestore("newHouse");
  },

  overwriteCurrentHouse() {
    this.confirmRestore("overwriteCurrent");
  },

  confirmRestore(mode: RestoreMode) {
    const snapshot = this.data.snapshot;
    if (!snapshot) return;
    wx.showModal({
      title: mode === "newHouse" ? "导入为新仓库" : "覆盖当前仓库",
      content: mode === "newHouse" ? "会追加备份中的仓库，现有数据不受影响。" : "会替换当前仓库内容，操作前会自动生成本地安全备份。",
      confirmText: "确认恢复",
      success: (res) => {
        if (!res.confirm) return;
        restoreFromSnapshot(snapshot, mode);
        wx.showToast({ title: "恢复完成" });
        setTimeout(() => wx.redirectTo({ url: "/pages/index/index" }), 500);
      }
    });
  },

  goBack() {
    wx.navigateBack();
  },

  closeHint() {
    markOnboardingHintSeen("backup");
    this.setData({ hintVisible: false });
  }
});
