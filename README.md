# 火星极客 · 微信小程序

「火星极客」品牌的小程序端：语言图鉴 + 关键字手册 + 品牌导流。

## 页面

| 页面 | 功能 |
|---|---|
| 首页 | 品牌展示、每日一语、数据统计、导航入口 |
| 图鉴 | 144 种语言列表，支持搜索 + 按年代筛选，点击进详情 |
| 详情 | 年份/作者/类型/范式、介绍、核心特性、关键字解析、代码示例 |
| 手册 | 进制转换器（二/八/十/十六）+ 三个分段：8 种语言完整关键字（含示例）/ DOS-CMD 106 条 / PowerShell 166 条，均可搜索 |
| 关于 | 品牌介绍、小游戏《红色星球计划》导流、公众号导流 |

## 本地预览

1. 打开微信开发者工具 → 导入项目
2. 选择本目录（`miniprogram`），AppID 先用测试号
3. 编译即可预览

## 发布前检查

- [ ] `project.config.json` 换成正式小程序 AppID
- [ ] 在微信公众平台完成小程序备案（国内发布必需）
- [ ] 确认 4 个 tab 页面在真机上样式正常
- [ ] tabBar 目前为纯文字导航，可自行添加图标（`app.json` → `iconPath`）

## 数据

`data/langs.js` 由 `~/workspace/langs-site` 的 144 种语言数据合并生成

`data/manual.js` 由 `~/workspace/langs-site/keywords.html` 的 SECTIONS 数据提取生成：
8 种语言完整关键字（Python 37 / C 34 / C++ 79 / C# 89 / Java 54 / Go 25 / JS 41 / BASIC 35，
每条含中文解析 + 示例代码）+ DOS/CMD 106 条 + PowerShell 166 条。
详情页中这 8 种语言自动显示完整版关键字（含示例），其余语言显示基础版。

## 知识库（v1.2+）

`~/workspace/miniprogram-db/` 为独立构建框架：从微软官方文档自动抓取，
生成 JSON 数据库并发布到本工程。

| 库 | 条目 | 来源 |
|---|---|---|
| DOS 命令 | 870 | Microsoft Learn 官方文档 |
| PowerShell | 261 cmdlet | Microsoft Learn 官方文档（4 核心模块） |
| 编程语言关键字 | 144 种 / 2057 关键字 | 火星极客精选 |

- 数据：三个独立分包（单个分包 ≤2MB 限制）——`packageDbDos`（870条DOS）/ `packageDbPs`（261个PS cmdlet）/ `packageDbLangs`（144种语言）
- 接口：主包 `data/db-loader.js`，各分包 `sub-loader.js`（搜索/分页/分类/高亮）
- 分包页面源码在 `~/workspace/miniprogram-db/pages-src/`，由 publish.js 复制发布
- `app.json` 已配 subpackages + preloadRule
- 字段名为短格式，映射表见 `~/workspace/miniprogram-db/README.md`
（介绍/特性/关键字来自 `extra/part1-6.json`），共 1763 条关键字解析。
网站数据更新后，用 `/tmp/merge-langs.js` 可重新生成。
