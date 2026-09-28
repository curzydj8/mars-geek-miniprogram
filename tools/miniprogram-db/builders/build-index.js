// 构建器：生成知识库总目录索引（主包用）
// 用法：node builders/build-index.js
// 输出：dist/data/db/index.json
const fs = require('fs');
const path = require('path');
const config = require('../config');

const ROOT = path.join(__dirname, '..');

const DB_META = {
  dos: { name: 'DOS 命令', icon: '🖥️', sourceName: 'Microsoft Learn 官方文档', home: 'https://learn.microsoft.com/windows-server/administration/windows-commands/windows-commands' },
  powershell: { name: 'PowerShell', icon: '🔷', sourceName: 'Microsoft Learn 官方文档', home: 'https://learn.microsoft.com/powershell/' },
  langs: { name: '编程语言关键字', icon: '🔑', sourceName: '火星极客精选', home: '' },
};

function main() {
  const dbs = [];
  let kwTotal = 0, exTotal = 0, paramTotal = 0;

  for (const db of ['dos', 'powershell', 'langs']) {
    const idx = JSON.parse(fs.readFileSync(path.join(ROOT, config[db].outDir, 'index.json'), 'utf8'));
    const raw = JSON.parse(fs.readFileSync(path.join(ROOT, config[db].outDir, '_raw.json'), 'utf8'));
    // 统计（用 _raw 全量数据）
    if (db === 'dos' || db === 'powershell') {
      raw.forEach(r => { exTotal += (r.examples || []).length; paramTotal += (r.params || []).length; });
    }
    if (db === 'langs') {
      raw.forEach(r => { kwTotal += (r.keywords || []).length; });
    }
    dbs.push({
      id: db,
      ...DB_META[db],
      total: idx.total,
      parts: idx.parts.length,
      categories: idx.categories,
      sourceBase: idx.sourceBase || '',
      updated: idx.updated,
    });
  }

  const master = {
    name: '火星极客知识库',
    updated: new Date().toISOString().slice(0, 10),
    dbs,
    stats: {
      dos: dbs[0].total,
      powershell: dbs[1].total,
      langs: dbs[2].total,
      keywords: kwTotal,
      examples: exTotal,
      params: paramTotal,
      records: dbs[0].total + dbs[1].total + dbs[2].total,
    },
  };

  const outDir = path.join(ROOT, 'dist', 'data', 'db');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(master));
  console.log('总索引已生成:', JSON.stringify(master.stats));
}

main();
