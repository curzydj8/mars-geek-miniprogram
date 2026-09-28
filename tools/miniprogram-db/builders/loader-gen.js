// 构建器：自动生成小程序数据加载接口
// 用法：node builders/loader-gen.js
// 输出：
//   dist/data/db-loader.js              主包加载接口（索引/统计/跳转）
//   dist/packageDbDos/sub-loader.js     DOS 分包加载接口
//   dist/packageDbPs/sub-loader.js     PowerShell 分包加载接口
//   dist/packageDbLangs/sub-loader.js   语言库分包加载接口
// 注意：微信限制单个分包 ≤2MB，因此按库拆成三个分包
const fs = require('fs');
const path = require('path');
const config = require('../config');

const ROOT = path.join(__dirname, '..');

const PKGS = {
  dos: { root: 'packageDbDos' },
  powershell: { root: 'packageDbPs' },
  langs: { root: 'packageDbLangs' },
};

const MAIN_LOADER = `// 火星极客知识库 · 主包加载接口（自动生成，请勿手改）
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
`;

function buildSubLoader(db) {
  const idx = JSON.parse(fs.readFileSync(path.join(ROOT, config[db].outDir, 'index.json'), 'utf8'));
  const reqLines = idx.parts.map(f => `  '${f}': require('./data/${db}/${f}'),`);
  return `// 火星极客知识库 · ${db} 分包加载接口（自动生成，请勿手改）
// 离线：全部分片随包发布，无需网络；分片按需加载并缓存
const FILES = {
${reqLines.join('\n')}
};
const DB_INDEX = require('./data/${db}/index.json');
let _all = null;

function allRecords() {
  if (!_all) {
    _all = DB_INDEX.parts.map(f => FILES[f]).reduce((a, b) => a.concat(b), []);
  }
  return _all;
}
function getDbIndex() { return DB_INDEX; }
function getCategories() { return DB_INDEX.categories; }
function getById(id) { return allRecords().find(r => r.id === id); }

// 分页列表（支持按分类过滤）
function list(opts) {
  opts = opts || {};
  const page = Math.max(1, opts.page || 1);
  const pageSize = opts.pageSize || 20;
  const category = opts.category || '';
  let arr = allRecords();
  if (category) arr = arr.filter(r => r.ct === category);
  const total = arr.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = arr.slice((page - 1) * pageSize, page * pageSize);
  return { items, total, page, pageSize, totalPages, hasMore: page < totalPages };
}

// 全文搜索（基于预计算 _st 索引字段）
function search(q, opts) {
  opts = opts || {};
  const page = Math.max(1, opts.page || 1);
  const pageSize = opts.pageSize || 20;
  const s = (q || '').trim().toLowerCase();
  if (!s) return { items: [], total: 0, page, pageSize, totalPages: 1, hasMore: false, q };
  const arr = allRecords().filter(r => (r._st || '').indexOf(s) >= 0);
  const total = arr.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const items = arr.slice((page - 1) * pageSize, page * pageSize);
  return { items, total, page, pageSize, totalPages, hasMore: page < totalPages, q };
}

// 关键字高亮：返回 [{t, hit}] 片段，供 wxml 渲染
function highlight(text, keyword) {
  text = text == null ? '' : String(text);
  keyword = (keyword || '').trim();
  if (!keyword) return [{ t: text, hit: false }];
  const esc = keyword.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
  const parts = text.split(new RegExp('(' + esc + ')', 'gi')).filter(p => p !== '');
  const low = keyword.toLowerCase();
  return parts.map(p => ({ t: p, hit: p.toLowerCase() === low }));
}

function sourceUrl(rec) {
  const base = DB_INDEX.sourceBase || '';
  return base && rec.src ? base + rec.src : '';
}

module.exports = { allRecords, getDbIndex, getCategories, getById, list, search, highlight, sourceUrl };
`;
}

function main() {
  // 主包接口
  const mainDir = path.join(ROOT, 'dist', 'data');
  fs.mkdirSync(mainDir, { recursive: true });
  fs.writeFileSync(path.join(mainDir, 'db-loader.js'), MAIN_LOADER);
  // 三个分包接口（每个分包只含自己库的数据）
  for (const db of Object.keys(PKGS)) {
    const subDir = path.join(ROOT, 'dist', PKGS[db].root);
    fs.mkdirSync(subDir, { recursive: true });
    fs.writeFileSync(path.join(subDir, 'sub-loader.js'), buildSubLoader(db));
  }
  console.log('加载接口已生成: dist/data/db-loader.js + 3 个分包 sub-loader.js');
}

main();
