// 火星极客知识库 · langs 分包加载接口（自动生成，请勿手改）
// 离线：全部分片随包发布，无需网络；分片按需加载并缓存
const FILES = {
  'part-01.json': require('./data/langs/part-01.json'),
  'part-02.json': require('./data/langs/part-02.json'),
  'part-03.json': require('./data/langs/part-03.json'),
};
const DB_INDEX = require('./data/langs/index.json');
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
  const esc = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp('(' + esc + ')', 'gi')).filter(p => p !== '');
  const low = keyword.toLowerCase();
  return parts.map(p => ({ t: p, hit: p.toLowerCase() === low }));
}

function sourceUrl(rec) {
  const base = DB_INDEX.sourceBase || '';
  return base && rec.src ? base + rec.src : '';
}

module.exports = { allRecords, getDbIndex, getCategories, getById, list, search, highlight, sourceUrl };
