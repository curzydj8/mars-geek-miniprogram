// DOS/CMD 命令抓取：从 Microsoft 官方文档 GitHub 仓库抓取 markdown 并解析
// 用法：node scrapers/dos.js
const fs = require('fs');
const path = require('path');
const config = require('../config');

const ROOT = path.join(__dirname, '..');
const UA = { 'User-Agent': 'mars-geek-db-builder/1.0' };

async function fetchText(url, retries = config.retry) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.text();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(r => setTimeout(r, 1500 * (i + 1)));
    }
  }
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      try { results[i] = await fn(items[i], i); }
      catch (e) { results[i] = { __error: String(e.message || e), __file: items[i] }; }
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

function stripMd(s) {
  return s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')  // 链接
    .replace(/[*_`>#]/g, '')                        // 标记
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();
}

// 解析单个 DOS 命令 markdown
function parseDosMd(file, md) {
  const rec = {
    id: 'dos-' + file.replace(/\.md$/, ''),
    name: '',
    source_file: file,
    source: config.dos.rawBase + file,
    summary_en: '',
    summary_cn: '',
    syntax: '',
    params: [],      // [{name, desc}]
    examples: [],    // [{desc, code}]
    remarks: '',
    category: config.dos.defaultCategory,
    updated: new Date().toISOString().slice(0, 10),
  };
  // frontmatter
  const fm = md.match(/^---\n([\s\S]*?)\n---/);
  if (fm) {
    const t = fm[1].match(/^title:\s*(.+)$/m);
    const d = fm[1].match(/^description:\s*(.+)$/m);
    if (t) rec.name = t[1].trim();
    if (d) rec.summary_en = d[1].trim();
  }
  const body = md.replace(/^---\n[\s\S]*?\n---\n/, '');
  // 简介：# 标题后的第一段
  const intro = body.match(/^# .+\n+([^#>!\n][^\n]*)/m);
  if (intro) rec.summary_en = rec.summary_en || stripMd(intro[1]);
  else if (!rec.summary_en && intro === null) {
    const p = body.match(/^# .+\n+((?:>.*\n)*)([^\n#>!][^\n]*)/m);
    if (p) rec.summary_en = stripMd(p[2]);
  }
  // Syntax 区
  const synSec = body.match(/## Syntax\n([\s\S]*?)(?=\n## |\n### |$)/);
  if (synSec) {
    const code = synSec[1].match(/```(?:\w*\n)?([\s\S]*?)```/);
    if (code) rec.syntax = code[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
  }
  // Parameters 表格
  const paramSec = body.match(/### Parameters\n([\s\S]*?)(?=\n#### |\n## |$)/);
  if (paramSec) {
    const rows = paramSec[1].match(/^\|.*\|$/gm) || [];
    rows.slice(2).forEach(r => {  // 跳过表头和分隔行
      const cells = r.split('|').slice(1, -1).map(c => stripMd(c));
      if (cells.length >= 2 && cells[0] && !/^Parameter$/i.test(cells[0])) {
        rec.params.push({ name: cells[0], desc: cells[1] });
      }
    });
  }
  // Examples：说明文字 + 代码块配对
  const exSec = body.match(/## Examples\n([\s\S]*?)(?=\n## |$)/);
  if (exSec) {
    const parts = exSec[1].split(/(```(?:\w*\n)?[\s\S]*?```)/g);
    let pendingDesc = '';
    for (const part of parts) {
      if (/^```/.test(part)) {
        const code = part.replace(/^```\w*\n?/, '').replace(/```$/, '')
          .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
        if (code) rec.examples.push({ desc: stripMd(pendingDesc).slice(0, 300), code });
        pendingDesc = '';
      } else {
        const t = stripMd(part);
        if (t && !t.startsWith('!NOTE') && !t.startsWith('[!')) pendingDesc += (pendingDesc ? ' ' : '') + t;
      }
    }
  }
  // Remarks
  const remSec = body.match(/#### Remarks\n([\s\S]*?)(?=\n#### |\n## |$)/);
  if (remSec) rec.remarks = stripMd(remSec[1]).slice(0, 2000);

  // 分类
  const probe = (rec.name + ' ' + rec.summary_en).toLowerCase();
  for (const c of config.dos.categories) {
    if (c.match.test(rec.name) || c.match.test(probe)) { rec.category = c.name; break; }
  }
  return rec;
}

async function main() {
  const cacheDir = path.join(ROOT, config.dos.cacheDir);
  fs.mkdirSync(cacheDir, { recursive: true });

  console.log('获取 DOS 命令文件列表…');
  const list = JSON.parse(await fetchText(config.dos.listUrl));
  const files = list.filter(f => f.name.endsWith('.md') && f.name !== 'windows-commands.md').map(f => f.name);
  console.log('共', files.length, '个命令文档');

  console.log('下载并解析（并发', config.concurrency, '）…');
  const results = await mapLimit(files, config.concurrency, async (file) => {
    const cp = path.join(cacheDir, file);
    let md;
    if (fs.existsSync(cp)) md = fs.readFileSync(cp, 'utf8');
    else { md = await fetchText(config.dos.rawBase + file); fs.writeFileSync(cp, md); }
    return parseDosMd(file, md);
  });

  const errors = results.filter(r => r.__error);
  const records = results.filter(r => !r.__error && r.name);
  console.log('解析成功', records.length, '条，失败', errors.length);
  errors.slice(0, 5).forEach(e => console.log('  失败:', e.__file, e.__error));

  // 合并已有的 106 条中文解析（按命令名匹配）
  try {
    const cnRaw = require('/home/hatch/workspace/miniprogram/data/manual.js');
    const cnMap = {};
    cnRaw.dos.rows.forEach(r => { cnMap[r.k.toLowerCase().split(' /')[0].split(' ')[0]] = r; });
    let merged = 0;
    records.forEach(rec => {
      const hit = cnMap[rec.name.toLowerCase()];
      if (hit) { rec.summary_cn = hit.d; merged++; }
    });
    console.log('合并中文解析', merged, '条');
  } catch (e) { console.log('中文合并跳过:', e.message); }

  const outDir = path.join(ROOT, config.dos.outDir);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, '_raw.json'), JSON.stringify(records));
  console.log('已保存', path.join(outDir, '_raw.json'));

  // 统计
  const cats = {};
  records.forEach(r => { cats[r.category] = (cats[r.category] || 0) + 1; });
  console.log('分类统计:', JSON.stringify(cats));
  const withSyntax = records.filter(r => r.syntax).length;
  const withParams = records.filter(r => r.params.length).length;
  const withExamples = records.filter(r => r.examples.length).length;
  console.log(`有语法: ${withSyntax}，有参数: ${withParams}，有示例: ${withExamples}`);
}

main().catch(e => { console.error('失败:', e); process.exit(1); });
