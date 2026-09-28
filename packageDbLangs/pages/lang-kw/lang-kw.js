const sub = require('../../sub-loader.js');

Page({
  data: {
    rec: null,
    q: '',
    kwList: [],
  },
  onLoad(opts) {
    const rec = sub.getById(opts.id);
    if (rec) {
      const name = rec.n.split('（')[0];
      wx.setNavigationBarTitle({ title: name.length > 12 ? name.slice(0, 12) : name });
      this.setData({ rec });
      this.applyKw();
    }
  },
  onInput(e) {
    this.setData({ q: e.detail.value.trim().toLowerCase() });
    this.applyKw();
  },
  applyKw() {
    const rec = this.data.rec;
    if (!rec) return;
    const q = this.data.q;
    const kwList = (rec.kw || [])
      .filter(k => !q || k.k.toLowerCase().indexOf(q) >= 0 || (k.d || '').toLowerCase().indexOf(q) >= 0)
      .map(k => ({ ...k, segs: sub.highlight(k.k, this.data.q) }));
    this.setData({ kwList });
  },
  onShareAppMessage() {
    const r = this.data.rec || {};
    return { title: '火星极客 · ' + (r.n || '语言关键字') };
  }
});
