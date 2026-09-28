const loader = require('../../data/db-loader.js');

Page({
  data: {
    stats: null,
    dbs: [],
    // 进制转换器（保留）
    convInput: '42',
    convBase: 10,
    bases: ['2', '8', '10', '16'],
    baseIdx: 2,
    convOut: {},
    query: '',
  },
  onLoad() {
    this.setData({ stats: loader.getStats(), dbs: loader.getDbs() });
    this.convert();
  },
  onShow() {
    // 每次显示刷新统计（离线数据，基本不变）
    this.setData({ stats: loader.getStats() });
  },
  onDbTap(e) {
    loader.goBrowser(e.currentTarget.dataset.db);
  },
  onCatTap(e) {
    const d = e.currentTarget.dataset;
    loader.goBrowser(d.db, { category: d.cat });
  },
  onQueryInput(e) {
    this.setData({ query: e.detail.value.trim() });
  },
  onSearch(e) {
    const db = e.currentTarget.dataset.db;
    const q = this.data.query;
    if (!q) return;
    loader.goBrowser(db, { q });
  },
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
