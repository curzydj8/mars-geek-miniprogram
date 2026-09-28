// 构建器：生成主包内置的精选速查数据
// 用法：node builders/featured-gen.js
// 输出：dist/data/featured.js（30 条常用 DOS + 20 条常用 PowerShell，全详情，主包内置）
// 目的：手册页打开即有实质内容，不依赖分包下载，评审视角零空白
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MP = '/home/hatch/workspace/miniprogram';

const DOS_WANT = ['dir','cd','copy','del','move','ren','mkdir','rmdir','type','echo','cls','path','set',
  'ipconfig','ping','netstat','tasklist','taskkill','sfc','chkdsk','format','robocopy','xcopy',
  'attrib','find','findstr','sort','tree','more','shutdown'];
const PS_WANT = ['Get-ChildItem','Set-Location','Copy-Item','Remove-Item','Move-Item','Rename-Item',
  'New-Item','Get-Content','Set-Content','Write-Host','Clear-Host','Get-Process','Stop-Process',
  'Get-Service','Test-Connection','Get-Help','Get-Command','Where-Object','ForEach-Object','Sort-Object'];

function loadAll(dataDir) {
  const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', dataDir, 'index.json'), 'utf8'));
  let all = [];
  for (const f of idx.parts) {
    all = all.concat(JSON.parse(fs.readFileSync(path.join(ROOT, 'data', dataDir, f), 'utf8')));
  }
  return all;
}

function slim(r) {
  const o = { id: r.id, n: r.n };
  const d = r.cn || r.en;
  if (d) o.d = d;
  if (r.syn) o.s = r.syn;
  if (r.pa && r.pa.length) o.p = r.pa;
  if (r.ex && r.ex.length) o.e = r.ex;
  return o;
}

const dosAll = loadAll('dos');
const psAll = loadAll('powershell');
const find = (arr, n) => arr.find(r => r.n && r.n.toLowerCase() === n.toLowerCase());

const dos = DOS_WANT.map(n => find(dosAll, n)).filter(Boolean).map(slim);
const ps = PS_WANT.map(n => find(psAll, n)).filter(Boolean).map(slim);

console.log(`精选: DOS ${dos.length}/${DOS_WANT.length}, PowerShell ${ps.length}/${PS_WANT.length}`);
const missingDos = DOS_WANT.filter(n => !find(dosAll, n));
const missingPs = PS_WANT.filter(n => !find(psAll, n));
if (missingDos.length) console.log('缺失 DOS:', missingDos.join(','));
if (missingPs.length) console.log('缺失 PS:', missingPs.join(','));

const js = '// 火星极客 · 手册精选（自动生成，请勿手改）\n'
  + '// 30 条常用 DOS/CMD + 20 条常用 PowerShell，全详情，主包内置离线可用\n'
  + 'module.exports=' + JSON.stringify({ dos, ps }) + ';\n';
fs.writeFileSync(path.join(ROOT, 'dist', 'data', 'featured.js'), js);
console.log('已生成 dist/data/featured.js', fs.statSync(path.join(ROOT, 'dist', 'data', 'featured.js')).size, 'bytes');
