const langs = require('../../data/langs.js');
const loader = require('../../data/db-loader.js');

Page({
  data: {
    daily: null,
    total: langs.length,
    kwTotal: 0,
    dbStats: null,
  },
  onLoad() {
    // 按日期确定每日一语，保证同一天看到同一条
    const now = new Date();
    const dayNum = Math.floor(now.getTime() / 86400000);
    const idx = dayNum % langs.length;
    const daily = Object.assign({ fullIdx: idx }, langs[idx]);
    let kwTotal = 0;
    for (const l of langs) kwTotal += (l.kw || []).length;
    this.setData({ daily, kwTotal, dbStats: loader.getStats() });
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },
  goTab(e) {
    wx.switchTab({ url: e.currentTarget.dataset.url });
  },
  goAbout() {
    wx.switchTab({ url: '/pages/about/about' });
  }
});
