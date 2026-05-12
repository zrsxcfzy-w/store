import { BackupSummary, createBackupSnapshot, markOnboardingHintSeen, shouldShowOnboardingHint } from "../../services/store";

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => `${value}`.padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fileTime(iso: string): string {
  return iso.replace(/[:.]/g, "-");
}

Page({
  data: {
    summary: {} as BackupSummary,
    createdAtText: "",
    cloudLoading: false,
    hintVisible: false
  },

  onShow() {
    const snapshot = createBackupSnapshot();
    this.setData({
      summary: snapshot.summary,
      createdAtText: formatDateTime(snapshot.createdAt)
    });
    if (shouldShowOnboardingHint("backup")) this.setData({ hintVisible: true });
  },

  exportLocal() {
    const snapshot = createBackupSnapshot();
    const content = JSON.stringify(snapshot, null, 2);
    const filePath = `${wx.env.USER_DATA_PATH}/home_inventory_backup_${fileTime(snapshot.createdAt)}.json`;
    wx.getFileSystemManager().writeFile({
      filePath,
      data: content,
      encoding: "utf8",
      success: () => {
        wx.setClipboardData({
          data: content,
          success: () => {
            wx.showModal({
              title: "本地备份已生成",
              content: `备份文件已保存，备份文本也已复制。\n${filePath}`,
              showCancel: false
            });
          }
        });
      },
      fail: () => {
        wx.setClipboardData({
          data: content,
          success: () => wx.showToast({ title: "已复制备份文本" })
        });
      }
    });
  },

  backupToCloud() {
    if (!wx.cloud) {
      wx.showToast({ title: "当前环境不支持云开发", icon: "none" });
      return;
    }
    this.setData({ cloudLoading: true });
    wx.cloud.callFunction({
      name: "storeBackup",
      data: {
        action: "create",
        snapshot: createBackupSnapshot()
      },
      success: () => {
        wx.showToast({ title: "云端备份完成" });
      },
      fail: () => {
        wx.showToast({ title: "云端备份失败", icon: "none" });
      },
      complete: () => {
        this.setData({ cloudLoading: false });
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
