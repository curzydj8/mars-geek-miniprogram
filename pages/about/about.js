Page({
  data: {},
  copyAccount() {
    wx.setClipboardData({
      data: '火星极客',
      success() {
        wx.showToast({ title: '已复制，去微信搜索关注', icon: 'none' });
      }
    });
  },
  onShareAppMessage() {
    return { title: '火星极客 · 代码人的星球' };
  }
});
