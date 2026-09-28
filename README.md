# 火星极客 · 微信小程序

「火星极客」微信小程序：144 种编程语言图鉴 + 离线知识库（DOS 命令 / PowerShell / 语言关键字）。

## 目录

- `/` — 小程序工程（原生微信小程序，AppID 见 `project.config.json`）
  - `pages/` — 首页 / 图鉴 / 手册（知识库首页）/ 关于
  - `data/` — 语言数据 + 知识库主包索引与加载接口
  - `packageDbDos/` / `packageDbPs/` / `packageDbLangs/` — 知识库分包（离线数据 + 浏览/详情页）
- `tools/miniprogram-db/` — 知识库构建框架：从微软官方文档自动抓取 → 生成 JSON → 自动分片 → 生成加载接口 → 一键发布

## 知识库数据

| 库 | 条目 | 来源 |
|---|---|---|
| DOS 命令 | 870 | Microsoft Learn 官方文档 |
| PowerShell | 261 cmdlet | Microsoft Learn 官方文档（4 核心模块） |
| 编程语言关键字 | 144 种 / 2057 关键字 | 火星极客精选 |

构建方法见 `tools/miniprogram-db/README.md`：

```bash
cd tools/miniprogram-db
node scrapers/dos.js && node scrapers/powershell.js && node scrapers/lang-keywords.js
node builders/split.js && node builders/build-index.js
node builders/loader-gen.js && node builders/publish.js
```

## 分包说明

微信限制单个分包 ≤2MB，因此知识库按库拆成三个分包（`app.json` 已配置 subpackages + preloadRule）：

- `packageDbDos`（~1.0MB）
- `packageDbPs`（~0.7MB）
- `packageDbLangs`（~0.2MB）

## 发布

微信开发者工具导入本目录，填入 AppID 后「上传」即可。
