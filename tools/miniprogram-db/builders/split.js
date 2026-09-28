// 构建器：将 _raw.json 修剪并按 partSize 自动拆分为多个 JSON 分片
// 用法：node builders/split.js
// 输出：data/<db>/part-01.json … + data/<db>/index.json（本库目录索引）
const fs = require('fs');
const path = require('path');
const config = require('../config');

const ROOT = path.join(__dirname, '..');

// 修剪规则：保证完整数据结构，控制单条体积（不插入"省略"占位）
const TRIM = {
  dos: {
    keep: ['id', 'name', 'category', 'summary_cn', 'summary_en', 'syntax', 'params', 'examples', 'source'],
    maxLen: { summary_en: 150, 'params[].desc': 100, 'examples[].code': 300, 'examples[].desc': 120 },
    maxCount: { params: 12, examples: 4 },
  },
  powershell: {
    keep: ['id', 'name', 'module', 'category', 'summary_cn', 'synopsis', 'syntax', 'description', 'params', 'examples', 'source'],
    maxLen: { synopsis: 200, description: 350, 'params[].desc': 120, 'examples[].code': 400, 'examples[].desc': 150, 'syntax[].code': 800 },
    maxCount: { params: 12, examples: 4, syntax: 3 },
  },
  langs: {
    keep: ['id', 'name', 'year', 'author', 'type', 'paradigms', 'typeSystem', 'domains', 'desc', 'features', 'code', 'keywords', 'keywordCount', 'hasFullKeywords', 'category', 'era'],
    maxLen: {},
    maxCount: {},
  },
};

function getPath(obj, p) {
  const m = p.match(/^(\w+)\[\]\.(\w+)$/);
  if (m) return { arr: obj[m[1]], key: m[2] };
  return { val: obj[p], key: p, obj };
}

// 短字段名映射（控制体积，结构完整；映射表见 README）
const SHORT = {
  summary_cn: 'cn', summary_en: 'en', synopsis: 'sy', syntax: 'syn',
  params: 'pa', examples: 'ex', description: 'de', category: 'ct',
  source: 'src', updated: 'up', module: 'mo', paradigms: 'pd',
  typeSystem: 'ts', domains: 'dm', features: 'ft', keywords: 'kw',
  keywordCount: 'kc', hasFullKeywords: 'fk', name: 'n',
};
const SHORT_SUB = { desc: 'd', code: 'c', title: 't', type: 'ty', set: 's' };

function shorten(obj) {
  if (Array.isArray(obj)) return obj.map(shorten);
  if (obj && typeof obj === 'object') {
    const o = {};
    for (const [k, v] of Object.entries(obj)) {
      o[SHORT[k] || SHORT_SUB[k] || k] = shorten(v);
    }
    return o;
  }
  return obj;
}

function trimRecord(db, rec) {
  const rule = TRIM[db];
  const out = {};
  for (const k of rule.keep) if (rec[k] !== undefined) out[k] = rec[k];
  for (const [p, max] of Object.entries(rule.maxLen)) {
    const t = getPath(out, p);
    if (t.arr && t.key) t.arr.forEach(it => { if (typeof it[t.key] === 'string' && it[t.key].length > max) it[t.key] = it[t.key].slice(0, max); });
    else if (typeof t.val === 'string' && t.val.length > max) t.obj[t.key] = t.val.slice(0, max);
  }
  for (const [p, max] of Object.entries(rule.maxCount)) {
    if (Array.isArray(out[p]) && out[p].length > max) out[p] = out[p].slice(0, max);
  }
  // source 存相对路径（完整 URL 可由 sourceBase 还原，见各库 index.json）
  if (out.src) {
    if (db === 'dos') out.src = out.src.split('/').pop();
    if (db === 'powershell') { const m = out.src.match(/(Microsoft\.PowerShell\.[^/]+\/[^/]+)$/); out.src = m ? m[1] : out.src; }
  }
  // 预计算搜索文本：名称+中文+参数名+语法首行（控制体积）
  const bits = [out.name, out.summary_cn, out.synopsis];
  if (db === 'dos') {
    bits.push((out.params || []).map(x => x.name).join(' '));
    bits.push((out.syntax || '').split('\n')[0]);
  }
  if (db === 'powershell') {
    bits.push((out.params || []).map(x => x.name).join(' '));
    bits.push((out.syntax || []).map(x => x.code.split('\n')[0]).join(' '));
  }
  if (db === 'langs') bits.push((out.keywords || []).map(x => x.k).join(' '));
  out._st = bits.filter(Boolean).join(' ').toLowerCase().slice(0, 800);
  return shorten(out);
}

function buildDb(db) {
  const cfg = config[db];
  const outDir = path.join(ROOT, cfg.outDir);
  const raw = JSON.parse(fs.readFileSync(path.join(outDir, '_raw.json'), 'utf8'));
  const records = raw.map(r => trimRecord(db, r));

  // 清理旧分片
  fs.readdirSync(outDir).filter(f => /^part-.*\.json$/.test(f)).forEach(f => fs.unlinkSync(path.join(outDir, f)));

  // 自动拆分
  const parts = [];
  for (let i = 0; i < records.length; i += config.partSize) {
    parts.push(records.slice(i, i + config.partSize));
  }
  const partFiles = parts.map((p, i) => {
    const fname = 'part-' + String(i + 1).padStart(2, '0') + '.json';
    fs.writeFileSync(path.join(outDir, fname), JSON.stringify(p));
    return fname;
  });

  // 本库目录索引（记录已转为短字段名，分类字段为 ct）
  const cats = {};
  records.forEach(r => { cats[r.ct] = (cats[r.ct] || 0) + 1; });
  const sourceBase = db === 'dos' ? config.dos.rawBase
    : db === 'powershell' ? 'https://raw.githubusercontent.com/MicrosoftDocs/PowerShell-Docs/main/reference/7.5/' : '';
  const index = {
    db,
    total: records.length,
    partSize: config.partSize,
    parts: partFiles,
    categories: Object.entries(cats).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    sourceBase,
    updated: new Date().toISOString().slice(0, 10),
  };
  fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index));
  const size = partFiles.reduce((n, f) => n + fs.statSync(path.join(outDir, f)).size, 0);
  console.log(`${db}: ${records.length} 条 -> ${parts.length} 个分片, ${(size / 1024).toFixed(0)}KB`);
  return index;
}

function main() {
  const indexes = {};
  ['dos', 'powershell', 'langs'].forEach(db => { indexes[db] = buildDb(db); });
  fs.writeFileSync(path.join(ROOT, 'data', '_split-done.json'), JSON.stringify({ ok: true, at: new Date().toISOString() }));
}

main();
