// 144 种编程语言关键字库构建：合并 langs.js（基础）与 manual.js（8 种完整版）
// 用法：node scrapers/lang-keywords.js
const fs = require('fs');
const path = require('path');
const config = require('../config');

const ROOT = path.join(__dirname, '..');

function eraOf(year) {
  if (year < 1970) return '1970 年以前';
  if (year < 1980) return '1970 年代';
  if (year < 1990) return '1980 年代';
  if (year < 2000) return '1990 年代';
  if (year < 2010) return '2000 年代';
  return '2010 年以后';
}

function main() {
  const langs = require('/home/hatch/workspace/miniprogram/data/langs.js');
  const manual = require('/home/hatch/workspace/miniprogram/data/manual.js');
  const fullMap = {};
  manual.langs.forEach(s => { fullMap[s.name] = s.rows; });

  const records = langs.map((l, i) => {
    const full = fullMap[l.n] || fullMap[l.n.split('（')[0]];
    const keywords = full
      ? full.map(r => ({ k: r.k, d: r.d, e: r.e || '' }))
      : (l.kw || []).map(k => ({ k: k.k, d: k.d || '', e: '' }));
    return {
      id: 'lang-' + i,
      name: l.n,
      year: l.y,
      author: l.by,
      type: l.t,
      paradigms: l.p || [],
      typeSystem: l.ts || '',
      domains: l.dom || [],
      desc: l.desc || '',
      features: l.feat || [],
      code: l.code || '',
      keywords,
      keywordCount: keywords.length,
      hasFullKeywords: !!full,
      category: l.t || '编程语言',
      era: eraOf(l.y || 2000),
      updated: new Date().toISOString().slice(0, 10),
    };
  });

  const outDir = path.join(ROOT, config.langs.outDir);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, '_raw.json'), JSON.stringify(records));
  console.log('语言库:', records.length, '种');
  console.log('关键字总数:', records.reduce((n, r) => n + r.keywords.length, 0));
  console.log('完整版语言:', records.filter(r => r.hasFullKeywords).length);
  const cats = {};
  records.forEach(r => { cats[r.category] = (cats[r.category] || 0) + 1; });
  console.log('分类:', JSON.stringify(cats));
}

main();
