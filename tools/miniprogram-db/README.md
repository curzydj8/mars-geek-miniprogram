# 火星极客小程序知识库 · 构建框架

从官方文档自动抓取 → 生成 JSON 数据库 → 自动拆分/索引 → 生成小程序加载接口 → 发布到小程序工程（含分包）。

## 一键构建

```bash
cd ~/workspace/miniprogram-db
node scrapers/dos.js          # 1. 抓 DOS 命令（微软官方文档，870 条）
node scrapers/powershell.js   # 2. 抓 PowerShell（4 个核心模块，261 个 cmdlet）
node scrapers/lang-keywords.js# 3. 144 种语言关键字库（2057 个关键字）
node builders/split.js        # 4. 自动拆分分片 + 各库目录索引
node builders/build-index.js  # 5. 总目录索引
node builders/loader-gen.js   # 6. 生成数据加载接口
node builders/featured-gen.js # 6b. 生成主包精选速查（30 DOS + 20 PS，全详情）
node builders/publish.js      # 7. 发布到小程序工程
```

抓取结果缓存在 `cache/`，重复运行直接读缓存。

## 数据结构（短字段名映射）

为控制体积，JSON 使用短字段名，结构完整：

| 短 | 全称 | 说明 |
|---|---|---|
| `n` | name | 名称 |
| `ct` | category | 分类 |
| `cn`/`en` | summary_cn/en | 中文/英文简介 |
| `sy` | synopsis | 简介（PS） |
| `syn` | syntax | 语法（DOS 为字符串，PS 为参数集数组） |
| `pa` | params | 参数 `[{n,d}]` / PS `[{n,ty,d}]` |
| `ex` | examples | 示例 `[{t,d,c}]`（标题/说明/代码） |
| `de` | description | 详细说明（PS） |
| `mo` | module | 所属模块（PS） |
| `kw` | keywords | 关键字 `[{k,d,e}]`（语言库） |
| `kc` | keywordCount | 关键字数量 |
| `src` | source | 文档源相对路径（完整 URL = 各库 index.json 的 sourceBase + src） |
| `_st` | searchText | 预计算搜索索引（小写） |

## 分片规则

- `config.partSize = 60`：单个分片最多 60 条，超过自动拆分
- 输出：`data/<db>/part-01.json …` + `data/<db>/index.json`（本库目录：总数/分片清单/分类统计）
- 总索引：`dist/data/db/index.json`（三个库 + 全局统计）

## 小程序加载接口

- 主包 `data/db-loader.js`：`getStats/getDbs/getCategories/goBrowser/goDosDetail/goPsDetail/goLangKw`
- 分包 `sub-loader.js`（每个分包一份，只认自己库，无 db 参数）：
  `list（分页）/search/highlight（高亮分段）/getById/getCategories/sourceUrl`
- 全部数据随包发布，离线可用，无需网络

## 小程序集成

- 主包：`data/db/`（总索引）+ `data/db-loader.js`（约 243KB）
- 三个独立分包（微信限制单个分包 ≤2MB，因此按库拆分）：
  - `packageDbDos`（1.03MB）：DOS 15 分片 + browser/dos-detail 页面
  - `packageDbPs`（0.67MB）：PowerShell 5 分片 + browser/ps-detail 页面
  - `packageDbLangs`（0.23MB）：语言库 3 分片 + browser/lang-kw 页面
  - 分包页面源码在 `pages-src/`，由 publish.js 复制发布
- `app.json` 已配 `subpackages` + `preloadRule`（进手册页时预下载三个分包）
- 手册 tab = 知识库首页：统计卡片 + 三库入口 + 分类直达 + 搜索
- 首页新增知识库统计卡片

## 需求对照

1. DOS 命令数据库 ✅（870 条，微软官方文档）
2. PowerShell 数据库 ✅（261 个 cmdlet，4 核心模块）
3. 144 种语言关键字库 ✅（2057 个关键字）
4. 全部 JSON ✅
5. 超长自动拆分 ✅（60 条/分片，23 个分片）
6. 搜索 ✅（预计算索引 + 分包全文搜）
7. 分页 ✅（list/search 的 page/pageSize，上滑加载更多）
8. 分类浏览 ✅（DOS 8 类 / PS 按模块 / 语言按类型年代）
9. 关键字高亮 ✅（highlight 返回命中分段）
10. 无"省略"占位 ✅（完整结构，参数/示例按条数保留）
11. 完整数据结构 ✅（见上表）
12. 首页统计 ✅
13. 离线浏览 ✅（全量随包）
14. 自动目录索引 ✅（各库 index.json + 总索引）
15. 自动生成加载接口 ✅（loader-gen.js）
