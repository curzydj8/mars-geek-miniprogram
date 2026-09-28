const loader = require('../../data/db-loader.js');
const featured = require('../../data/featured.js');

Page({
  data: {
    stats: null,
    dbs: [],
    // 精选速查（主包内置）
    featTab: 'dos', // dos | ps
    featList: [],
    expandedId: '',
    // 每个库独立的搜索框
    queries: {},
    // 进制转换器（保留）
    convInput: '42',
    convBase: 10,
    bases: ['2', '8', '10', '16'],
    baseIdx: 2,
    convOut: {},
  },
  onLoad() {
    this.setData({
      stats: loader.getStats(),
      dbs: loader.getDbs(),
      featList: featured.dos,
    });
    this.convert();
  },
  onShow() {
    this.setData({ stats: loader.getStats() });
  },
  // ---- 精选速查 ----
  onFeatTab(e) {
    const t = e.currentTarget.dataset.tab;
    this.setData({
      featTab: t,
      featList: t === 'dos' ? featured.dos : featured.ps,
      expandedId: '',
    });
  },
  onFeatToggle(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ expandedId: this.data.expandedId === id ? '' : id });
  },
  // ---- 全库入口 ----
  onDbTap(e) {
    loader.goBrowser(e.currentTarget.dataset.db);
  },
  onCatTap(e) {
    const d = e.currentTarget.dataset;
    if (!d.db) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      return;
    }
    loader.goBrowser(d.db, { category: d.cat });
  },
  onQueryInput(e) {
    const db = e.currentTarget.dataset.db;
    this.setData({ ['queries.' + db]: e.detail.value });
  },
  onSearch(e) {
    const db = e.currentTarget.dataset.db;
    const q = ((this.data.queries[db] || '') + '').trim();
    if (!db || !q) return;
    loader.goBrowser(db, { q });
  },
  // ---- 进制转换器 ----
  onConvInput(e) {
    this.setData({ convInput: e.detail.value.trim() });
    this.convert();
  },
  onPickBase(e) {
    this.setData({ baseIdx: Number(e.detail.value), convBase: Number(this.data.bases[e.detail.value]) });
    this.convert();
  },
  convert() {
    const s = this.data.convInput;
    const base = this.data.convBase;
    const n = parseInt(s, base);
    if (isNaN(n)) {
      this.setData({ convOut: null });
      return;
    }
    this.setData({
      convOut: {
        b2: n.toString(2),
        b8: n.toString(8),
        b10: n.toString(10),
        b16: n.toString(16).toUpperCase(),
      }
    });
  }
});
