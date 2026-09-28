// 构建器：一键发布到小程序工程
// 用法：node builders/publish.js
// 1) 复制 dist/data/db/index.json + db-loader.js -> miniprogram/data/
// 2) 每个库独立分包（微信限制单个分包 ≤2MB）：
//      packageDbDos   <- sub-loader.js + data/dos/*   + pages/browser + pages/dos-detail
//      packageDbPs    <- sub-loader.js + data/powershell/* + pages/browser + pages/ps-detail
//      packageDbLangs <- sub-loader.js + data/langs/* + pages/browser + pages/lang-kw
//    页面源码来自 pages-src/
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MP = '/home/hatch/workspace/miniprogram';

const PKGS = {
  dos: { root: 'packageDbDos', pages: ['browser', 'dos-detail'] },
  powershell: { root: 'packageDbPs', pages: ['browser', 'ps-detail'] },
  langs: { root: 'packageDbLangs', pages: ['browser', 'lang-kw'] },
};

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const f of fs.readdirSync(src)) {
    const s = path.join(src, f), d = path.join(dest, f);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function main() {
  const dist = path.join(ROOT, 'dist');
  // 主包：总索引 + 加载接口
  copyDir(path.join(dist, 'data', 'db'), path.join(MP, 'data', 'db'));
  fs.copyFileSync(path.join(dist, 'data', 'db-loader.js'), path.join(MP, 'data', 'db-loader.js'));

  // 删除旧的单分包
  fs.rmSync(path.join(MP, 'packageDb'), { recursive: true, force: true });

  for (const db of Object.keys(PKGS)) {
    const { root, pages } = PKGS[db];
    const pkgDir = path.join(MP, root);
    fs.rmSync(pkgDir, { recursive: true, force: true });
    fs.mkdirSync(pkgDir, { recursive: true });
    // 接口 + 数据（只取 index.json 与分片，不含 _raw.json）
    fs.copyFileSync(path.join(dist, root, 'sub-loader.js'), path.join(pkgDir, 'sub-loader.js'));
    const dataSrc = path.join(ROOT, 'data', db);
    const dataDest = path.join(pkgDir, 'data', db);
    fs.mkdirSync(dataDest, { recursive: true });
    for (const f of fs.readdirSync(dataSrc)) {
      if (/^(index\.json|part-.*\.json)$/.test(f)) fs.copyFileSync(path.join(dataSrc, f), path.join(dataDest, f));
    }
    // 页面
    for (const p of pages) {
      copyDir(path.join(ROOT, 'pages-src', p), path.join(pkgDir, 'pages', p));
    }
  }

  // 统计
  console.log('包体积检查（单个包 ≤2MB，总和 ≤20MB）：');
  let total = 0;
  for (const root of ['packageDbDos', 'packageDbPs', 'packageDbLangs']) {
    let size = 0;
    (function walk(d) {
      for (const f of fs.readdirSync(d)) {
        const p = path.join(d, f);
        if (fs.statSync(p).isDirectory()) walk(p);
        else size += fs.statSync(p).size;
      }
    })(path.join(MP, root));
    total += size;
    const ok = size <= 2 * 1024 * 1024;
    console.log(`  ${root}: ${(size / 1024 / 1024).toFixed(2)}MB ${ok ? '✓' : '✗ 超限！'}`);
    if (!ok) process.exitCode = 1;
  }
  console.log(`  分包总和: ${(total / 1024 / 1024).toFixed(2)}MB`);
}

main();
