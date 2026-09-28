// 火星极客知识库 · 主包加载接口（自动生成，请勿手改）
// 离线：索引随包发布，无需网络
const INDEX = require('./db/index.json');

const ROUTES = {
  dos: { root: '/packageDbDos', browser: '/pages/browser/browser', detail: '/pages/dos-detail/dos-detail' },
  powershell: { root: '/packageDbPs', browser: '/pages/browser/browser', detail: '/pages/ps-detail/ps-detail' },
  langs: { root: '/packageDbLangs', browser: '/pages/browser/browser', detail: '/pages/lang-kw/lang-kw' },
};

function getIndex() { return INDEX; }
function getStats() { return INDEX.stats; }
function getDbs() { return INDEX.dbs; }
function getDb(id) { return INDEX.dbs.find(d => d.id === id); }
function getCategories(db) { const d = getDb(db); return d ? d.categories : []; }

// 跳转到对应分包的浏览页
function goBrowser(db, opts) {
  opts = opts || {};
  const r = ROUTES[db];
  if (!r) {
    if (typeof wx !== 'undefined' && wx.showToast) wx.showToast({ title: '知识库加载失败', icon: 'none' });
    return;
  }
  const q = ['db=' + db];
  if (opts.category) q.push('category=' + encodeURIComponent(opts.category));
  if (opts.q) q.push('q=' + encodeURIComponent(opts.q));
  wx.navigateTo({ url: r.root + r.browser + '?' + q.join('&') });
}
function goDosDetail(id) { const r = ROUTES.dos; wx.navigateTo({ url: r.root + r.detail + '?id=' + id }); }
function goPsDetail(id) { const r = ROUTES.powershell; wx.navigateTo({ url: r.root + r.detail + '?id=' + id }); }
function goLangKw(id) { const r = ROUTES.langs; wx.navigateTo({ url: r.root + r.detail + '?id=' + id }); }

module.exports = { getIndex, getStats, getDbs, getDb, getCategories, goBrowser, goDosDetail, goPsDetail, goLangKw };
