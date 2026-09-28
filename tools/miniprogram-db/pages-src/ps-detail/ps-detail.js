const sub = require('../../sub-loader.js');

Page({
  data: { rec: null },
  onLoad(opts) {
    const rec = sub.getById(opts.id);
    if (rec) {
      const title = rec.n.length > 12 ? rec.n.slice(0, 12) : rec.n;
      wx.setNavigationBarTitle({ title });
      this.setData({ rec });
    }
  },
  onShareAppMessage() {
    const r = this.data.rec || {};
    return { title: '火星极客 · ' + (r.n || '') };
  }
});
