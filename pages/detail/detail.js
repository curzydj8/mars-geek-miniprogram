const langs = require('../../data/langs.js');
const manual = require('../../data/manual.js');

// 完整版关键字映射：语言名 -> 完整关键字表（含示例）
const FULL_KW = {};
manual.langs.forEach(s => {
  FULL_KW[s.name] = s.rows;
  FULL_KW[s.name.split('（')[0]] = s.rows;
});

Page({
  data: {
    lang: null,
    fullKw: null,
  },
  onLoad(options) {
    const id = Number(options.id) || 0;
    const lang = langs[id] || langs[0];
    wx.setNavigationBarTitle({ title: lang.n.split('（')[0] });
    const fullKw = FULL_KW[lang.n] || FULL_KW[lang.n.split('（')[0]] || null;
    this.setData({ lang, fullKw });
  },
  onShareAppMessage() {
    const l = this.data.lang || {};
    return { title: '火星极客 · ' + (l.n || '语言图鉴') };
  }
});
