// PowerShell cmdlet 抓取：从 Microsoft 官方文档 GitHub 仓库抓取 markdown 并解析
// 用法：node scrapers/powershell.js
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
      catch (e) { results[i] = { __error: String(e.message || e), __file: items[i].name }; }
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

function stripMd(s) {
  return (s || '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>#]/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();
}

function section(body, name) {
  const re = new RegExp('## ' + name + '\\n([\\s\\S]*?)(?=\\n## |$)');
  const m = body.match(re);
  return m ? m[1] : '';
}

// 解析单个 cmdlet markdown
function parsePsMd(module, file, md) {
  const name = file.replace(/\.md$/, '');
  const rec = {
    id: 'ps-' + name.toLowerCase(),
    name,
    module,
    source: config.powershell.rawBase(module) + file,
    synopsis: '',
    syntax: [],      // [{set, code}]
    description: '',
    params: [],      // [{name, type, desc}]
    examples: [],    // [{title, desc, code}]
    category: module.replace('Microsoft.PowerShell.', ''),
    updated: new Date().toISOString().slice(0, 10),
  };
  const body = md.replace(/^---\n[\s\S]*?\n---\n/, '');
  rec.synopsis = stripMd(section(body, 'SYNOPSIS')).slice(0, 500);

  // SYNTAX：每个参数集一个 code 块
  const synSec = section(body, 'SYNTAX');
  const setRe = /### ([^\n]+)\n+```powershell\n([\s\S]*?)```/g;
  let sm;
  while ((sm = setRe.exec(synSec)) && rec.syntax.length < 6) {
    rec.syntax.push({ set: stripMd(sm[1]), code: sm[2].trim().slice(0, 1500) });
  }

  // DESCRIPTION：取前两段
  const descParas = section(body, 'DESCRIPTION').split(/\n{2,}/).map(stripMd).filter(p => p && !p.startsWith('!'));
  rec.description = descParas.slice(0, 2).join('\n').slice(0, 1200);

  // EXAMPLES：### Example N: 标题
  const exSec = section(body, 'EXAMPLES');
  const exRe = /### Example \d+:?\s*([^\n]*)\n([\s\S]*?)(?=### Example \d+|$)/g;
  let em;
  while ((em = exRe.exec(exSec)) && rec.examples.length < 6) {
    const exBody = em[2];
    const codes = [...exBody.matchAll(/```powershell\n([\s\S]*?)```/g)].map(c => c[1].trim());
    const desc = exBody.split('```')[0];
    // 第一个代码块通常是命令，后续可能是输出；只取第一个
    if (codes.length) {
      rec.examples.push({
        title: stripMd(em[1]).slice(0, 200),
        desc: stripMd(desc).slice(0, 300),
        code: codes[0].slice(0, 1200),
      });
    }
  }

  // PARAMETERS：### -Name 小节
  const paramSec = section(body, 'PARAMETERS');
  const pRe = /### (-[\w]+)\n([\s\S]*?)(?=### -|\n## |$)/g;
  let pm;
  while ((pm = pRe.exec(paramSec)) && rec.params.length < 25) {
    const pBody = pm[2];
    const typeM = pBody.match(/Type:\s*([^\n|]+)/);
    const desc = pBody.split(/\n{2,}/).map(stripMd).filter(p => p && !/^(Type|Position|Default value|Required|Accept pipeline|Accept wildcard)/i.test(p));
    if (pm[1] !== '-CommonParameters') {
      rec.params.push({
        name: pm[1],
        type: typeM ? stripMd(typeM[1]).slice(0, 80) : '',
        desc: (desc[0] || '').slice(0, 400),
      });
    }
  }
  return rec;
}

async function main() {
  const cacheDir = path.join(ROOT, config.powershell.cacheDir);
  fs.mkdirSync(cacheDir, { recursive: true });
  const all = [];

  for (const mod of config.powershell.modules) {
    console.log('== 模块', mod);
    const list = JSON.parse(await fetchText(config.powershell.listUrl(mod)));
    const files = list.filter(f => f.name.endsWith('.md') && !/about_/i.test(f.name)).map(f => f.name);
    console.log('  共', files.length, '个 cmdlet 文档');
    const results = await mapLimit(files, config.concurrency, async (file) => {
      const modDir = path.join(cacheDir, mod);
      fs.mkdirSync(modDir, { recursive: true });
      const cp = path.join(modDir, file);
      let md;
      if (fs.existsSync(cp)) md = fs.readFileSync(cp, 'utf8');
      else { md = await fetchText(config.powershell.rawBase(mod) + file); fs.writeFileSync(cp, md); }
      return parsePsMd(mod, file, md);
    });
    const errors = results.filter(r => r.__error);
    const records = results.filter(r => !r.__error);
    console.log('  解析成功', records.length, '，失败', errors.length);
    errors.slice(0, 3).forEach(e => console.log('   失败:', e.__file, e.__error));
    all.push(...records);
  }

  // 合并已有的 166 条中文解析（按 cmdlet 名匹配）
  try {
    const cnRaw = require('/home/hatch/workspace/miniprogram/data/manual.js');
    const cnMap = {};
    cnRaw.powershell.rows.forEach(r => { cnMap[r.k.toLowerCase()] = r; });
    let merged = 0;
    all.forEach(rec => {
      const hit = cnMap[rec.name.toLowerCase()];
      if (hit) { rec.summary_cn = hit.d; merged++; }
    });
    console.log('合并中文解析', merged, '条');
  } catch (e) { console.log('中文合并跳过:', e.message); }

  const outDir = path.join(ROOT, config.powershell.outDir);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, '_raw.json'), JSON.stringify(all));
  console.log('已保存', path.join(outDir, '_raw.json'), '共', all.length, '条');

  const withSyn = all.filter(r => r.synopsis).length;
  const withEx = all.filter(r => r.examples.length).length;
  console.log(`有简介: ${withSyn}，有示例: ${withEx}`);
  console.log('示例总数:', all.reduce((n, r) => n + r.examples.length, 0));
}

main().catch(e => { console.error('失败:', e); process.exit(1); });
