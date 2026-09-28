const sub = require('../../sub-loader.js');

const DB_NAMES = { dos: 'DOS 命令', powershell: 'PowerShell', langs: '编程语言' };
const DETAIL_ROUTES = {
  dos: '../dos-detail/dos-detail',
  powershell: '../ps-detail/ps-detail',
  langs: '../lang-kw/lang-kw',
};

Page({
  data: {
    db: 'dos',
    q: '',
    category: '',
    cats: [],
    items: [],
    page: 1,
    totalPages: 1,
    total: 0,
    inputQ: '',
  },
  onLoad(opts) {
    const db = opts.db || 'dos';
    const q = opts.q ? decodeURIComponent(opts.q) : '';
    const category = opts.category ? decodeURIComponent(opts.category) : '';
    this.setData({ db, q, inputQ: q, category, cats: sub.getCategories() });
    wx.setNavigationBarTitle({ title: DB_NAMES[db] || '知识库' });
    this.reload();
  },
  reload() { this.loadPage(1); },
  loadPage(p) {
    const { db, q, category } = this.data;
    const res = q
      ? sub.search(q, { page: p, pageSize: 20 })
      : sub.list({ category, page: p, pageSize: 20 });
    const items = res.items.map(r => ({
      id: r.id,
      segs: sub.highlight(r.n, q),
      sub: r.cn || r.en || r.sy || '',
      meta: db === 'langs' ? (r.kc + ' 个关键字') : r.ct,
    }));
    this.setData({
      items: p === 1 ? items : this.data.items.concat(items),
      page: res.page, totalPages: res.totalPages, total: res.total,
    });
  },
  onReachBottom() {
    if (this.data.page < this.data.totalPages) this.loadPage(this.data.page + 1);
  },
  onCatTap(e) {
    this.setData({ category: e.currentTarget.dataset.cat, q: '', inputQ: '' });
    this.reload();
  },
  onClearFilter() {
    this.setData({ category: '', q: '', inputQ: '' });
    this.reload();
  },
  onInput(e) { this.setData({ inputQ: e.detail.value }); },
  onSearch() {
    const q = this.data.inputQ.trim();
    this.setData({ q, category: '' });
    this.reload();
  },
  onItemTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: DETAIL_ROUTES[this.data.db] + '?id=' + id });
  },
});
