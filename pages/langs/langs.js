const langs = require('../../data/langs.js');

const ERAS = [
  { label: '全部', min: 0, max: 9999 },
  { label: '1950s前', min: 0, max: 1959 },
  { label: '1960s', min: 1960, max: 1969 },
  { label: '1970s', min: 1970, max: 1979 },
  { label: '1980s', min: 1980, max: 1989 },
  { label: '1990s', min: 1990, max: 1999 },
  { label: '2000s', min: 2000, max: 2009 },
  { label: '2010s后', min: 2010, max: 9999 },
];

Page({
  data: {
    eras: ERAS.map(e => e.label),
    eraIdx: 0,
    query: '',
    list: [],
  },
  onLoad() {
    this.applyFilter();
  },
  onInput(e) {
    this.setData({ query: e.detail.value.trim() });
    this.applyFilter();
  },
  onEra(e) {
    this.setData({ eraIdx: Number(e.currentTarget.dataset.i) });
    this.applyFilter();
  },
  applyFilter() {
    const era = ERAS[this.data.eraIdx];
    const q = this.data.query.toLowerCase();
    const list = [];
    for (let i = 0; i < langs.length; i++) {
      const l = langs[i];
      if (l.y < era.min || l.y > era.max) continue;
      if (q && l.n.toLowerCase().indexOf(q) < 0 && (l.desc || '').toLowerCase().indexOf(q) < 0) continue;
      list.push({ i, n: l.n, y: l.y, t: l.t });
    }
    this.setData({ list });
  },
  goDetail(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.currentTarget.dataset.id });
  }
});
