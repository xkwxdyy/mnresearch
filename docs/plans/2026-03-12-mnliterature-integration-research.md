# MNLiterature 联动调研与开发计划

**Goal:** 让 `mnresearch` 能稳定读取 `mnliterature` 的文献信息，并为后续“研究问题 ↔ 文献 ↔ 阅读状态”深度联动打下干净边界。

**Core Judgment:** `mnresearch` 不应该自己做一套文献管理。文献实体、元数据编辑、阅读流程、引用绑定，主真源都应该继续留在 `mnliterature`。`mnresearch` 只消费只读快照、定位能力和少量上下文状态。

**Date:** 2026-03-12

---

## 1. 结论先说死

### 1.1 保留什么边界

- `mnliterature` 负责：
  - 文献主实体
  - 文献元数据编辑
  - 文献库索引
  - 阅读模式绑定
  - 引用/被引关系
- `mnresearch` 负责：
  - 研究问题树
  - 判断 / 策略 / 障碍 / 样例 / 局部认识
  - 专注推进与研究摘要
  - 把“哪篇文献支撑哪个研究对象”组织起来

### 1.2 第一阶段该怎么做

第一阶段不要碰 `mnliterature` WebView，也不要先设计一套复杂广播协议。

最稳的路径是：

1. `mnresearch` Native 层直接检查 `global.MNLiteratureInstance`
2. 直接调用它现成的只读方法获取文献索引
3. 在 `mnresearch` 内部做一层轻量归一化，传给自己的 WebView
4. UI 先只做“读取 / 搜索 / 挂接 / 跳转”，不做文献编辑

这是最短路径，也是最不傻的路径。

---

## 2. 调研结论

## 2.1 `mnliterature` 的现成入口

### A. 共享实例入口

`../mnliterature/main.js`

- `global.MNLiteratureInstance = self`
- 这是当前最重要的联动入口

可直接复用的核心方法：

- `loadLibraryIndex(libraryType, options)`
- `loadLiteratureDataToWebView()`
- `findLiteratureByMd5(docMd5)`
- `findLiteratureEntryById(noteId)`
- `findLiteratureByCoverMd5(docMd5)`

判断：

- 这是第一阶段最该走的入口
- 原因：它已经是 `mnliterature` 自己的生产路径，不是试验性 helper

### B. 跨插件命令广播

`../mnliterature/main.js` 的 `onAddonBroadcast`

已支持 action：

- `focusCard`
- `focusCardAbstract`
- `focusCardAndEdit`
- `openManager`
- `startReading`
- `stopReading`
- `syncReadingModeState`
- `searchLiterature`
- `focusMetadata`
- `citationCardify`
- `createLiteratureFromJSON`
- `importLiteratureFromJSONFile`

判断：

- 这层适合“命令式联动”
- 不适合第一阶段用来拉全量数据
- 原因：它是 fire-and-forget 风格，没有现成 response payload 协议

### C. WebView 内的 Bridge

`../mnliterature/scripts/literature-bridge-data-runtime.js`

- `Bridge.loadLiteratures(data)`

`../mnliterature/scripts/literature-bridge-focus-runtime.js`

- `Bridge.searchLiterature`
- `Bridge.focusCard`
- `Bridge.focusMetadataNote`

判断：

- 这是 `mnliterature` Web 前端的稳定运行时契约
- 但 `mnresearch` 第一阶段不该直接依赖它
- 原因：你得先拿到对方 WebView 控制权，耦合更高

---

## 2.2 文献数据的真实来源

`mnliterature` 没有一个单独的“主文献大 JSON”。

它的主文献列表是这样拼出来的：

1. `article` 库索引
2. `book` 库索引
3. 再合并增量索引

关键函数：

`../mnliterature/main.js`

- `_loadPrimaryLiteratures()`
- `_pushLiteraturesToWebView(literatures)`
- `loadLiteratureDataToWebView()`

其中：

- `_loadPrimaryLiteratures()` 读 `article + book`
- `loadLiteratureDataToWebView()` 再合并 `literatureIndexer.loadIncrementalIndex()`
- 最后调用 `window.Bridge.loadLiteratures({ literatures })`

判断：

- `Bridge.loadLiteratures({ literatures })` 是现成主列表数据契约
- `loadLibraryIndex()` 是当前最稳的原生读取入口

---

## 2.3 索引文件落点

主索引文件都在：

`MNUtil.dbFolder/data/`

核心文件：

- `lit-article-index-manifest.json`
- `lit-book-index-manifest.json`
- `lit-article-index-part-*.json`
- `lit-book-index-part-*.json`
- `lit-incremental-index.json`

关键代码：

`../mnliterature/literatureIndexer.js`

- `buildSearchIndex(...)`
- `saveIndexManifest(...)`
- `loadManifest(...)`

以及 `../mnliterature/main.js`

- `loadLibraryIndex(libraryType, options)`

判断：

- 这条路径很适合做兜底 fallback
- 当 `MNLiteratureInstance` 不可用时，`mnresearch` 可以直接读这些 JSON

---

## 2.4 文献条目 shape

文献索引条目的核心 shape 来自：

`../mnliterature/literatureIndexer.js` 的 `buildIndexEntry(note, libraryType)`

关键字段包括：

- `id`
- `title`
- `titleAlt`
- `titleLinks`
- `rawTitle`
- `type`
- `referenceType`
- `authors`
- `editors`
- `year`
- `date`
- `journal`
- `booktitle`
- `conference`
- `publisher`
- `seriesName`
- `keywords`
- `abstract`
- `doi`
- `isbn`
- `pinned`
- `md5`
- `hasCover`
- `readingRelatedClassifications`
- `structureItems`

判断：

- 第一阶段不要把这些字段全抬进 `mnresearch`
- 够用字段应压缩为研究视角快照：
  - `id`
  - `title`
  - `authors`
  - `year`
  - `referenceType`
  - `journal/booktitle/publisher`
  - `keywords`
  - `abstract`
  - `doi`
  - `md5`
  - `hasCover`

---

## 2.5 现成的查找能力

`../mnliterature/main.js`

- `findLiteratureByMd5(docMd5)`
- `findLiteratureByCoverMd5(docMd5)`
- `findLiteratureEntryById(noteId)`
- `_findLiteratureEntryInLibrariesById(targetId, libraryTypes)`

判断：

- 这几个方法非常适合 `mnresearch` 第一阶段使用
- 特别是：
  - 当前 PDF -> 定位文献卡：`findLiteratureByMd5`
  - 已挂文献 id -> 取条目快照：`findLiteratureEntryById`

---

## 3. 接入方案比较

## 3.1 方案 A：直接调用 `MNLiteratureInstance`

### 做法

- 在 `mnresearch/main.js` 或独立 adapter 中检查：
  - `global.MNLiteratureInstance`
- 如果存在，直接调用：
  - `loadLibraryIndex("article")`
  - `loadLibraryIndex("book")`
  - `findLiteratureByMd5(docMd5)`
  - `findLiteratureEntryById(noteId)`

### 优点

- 路径短
- 数据新
- 直接复用生产代码
- 不需要先改 `mnliterature`

### 风险

- 依赖 `mnliterature` 已加载到同一 JSB 运行时
- 后续如果对方重构方法名，需要同步

### 结论

第一阶段主方案。

---

## 3.2 方案 B：通过 `AddonBroadcast` 请求数据

### 做法

- 给 `mnliterature` 新增：
  - `getResearchSnapshot`
  - `queryLiteratureByMd5`
  - `queryLiteratureById`
- 再通过 `AddonBroadcast` 回传 payload

### 优点

- 插件边界更正规
- 解耦更强

### 风险

- 现在没有现成 response 协议
- 需要先改两边
- 第一阶段成本太高

### 结论

第二阶段再做，不要一上来把事情做复杂。

---

## 3.3 方案 C：直接读索引 JSON

### 做法

- `mnresearch` 直接读：
  - `lit-article-index-manifest.json`
  - `lit-book-index-manifest.json`
  - `lit-incremental-index.json`

### 优点

- `mnliterature` 没打开也能读
- 无需依赖 `global.MNLiteratureInstance`

### 风险

- 要自己处理 manifest + parts + incremental merge
- 需要跟对方索引格式保持兼容

### 结论

适合做 fallback，不适合当主方案。

---

## 4. 推荐架构

推荐用“双通道”：

### 主通道

`MNLiteratureInstance` 直接读取

### 兜底通道

直接读索引 JSON

### 不做的事

- 不读 `mnliterature` WebView 的 `state`
- 不在 `mnresearch` 做文献编辑
- 不复制一套文献 schema

---

## 5. 第一阶段功能范围：先实现“从 MNLiterature 获取信息”

## 5.1 `mnresearch` 内部新增只读 adapter

建议新增一个 Native 侧模块，例如：

- `mnliteratureAdapter.js`

暴露这些只读方法：

- `isAvailable()`
- `getPrimaryLiteratures(options)`
- `findLiteratureByMd5(docMd5)`
- `findLiteratureEntryById(noteId)`
- `openLiteratureManager(noteId?)`

其中：

- `getPrimaryLiteratures()`：
  - 优先走 `MNLiteratureInstance.loadLibraryIndex("article"|"book")`
  - 再合并增量索引
  - 失败时 fallback 到 JSON 读取

---

## 5.2 在 `mnresearch` 内部定义“研究用文献快照”

不要把 `mnliterature` entry 原样扔进研究状态。

建议在 `mnresearch` 里归一化成：

```js
{
  id: "noteId",
  title: "title",
  titleAlt: "titleAlt",
  authors: ["Ada Lovelace", "Alan Turing"],
  year: "2024",
  referenceType: "期刊论文",
  venue: "Annals of Math",
  doi: "10.xxx",
  keywords: ["harmonic analysis"],
  abstract: "...",
  md5: "docmd5",
  hasCover: true,
  source: "mnliterature"
}
```

研究侧只保留自己真的会消费的字段。

---

## 5.3 第一阶段 UI 能力

第一阶段就做这几个动作，别发散：

- 从 `mnliterature` 读取主文献列表
- 按标题 / 作者 / 年份搜索
- 根据当前 PDF `docmd5` 尝试自动定位文献
- 把文献挂到：
  - 问题
  - 判断
  - 策略
  - 障碍
  - 样例
  - 局部认识
  - 专注会话
- 一键跳回 `mnliterature`：
  - `focusCard`
  - `focusCardAndEdit`
  - `openManager`

---

## 6. 后续阶段

## 阶段 2：正式通信协议

给 `mnliterature` 增加研究专用广播 action：

- `queryResearchLiteratures`
- `queryLiteratureByMd5`
- `queryLiteratureById`

并增加 response payload + requestId。

目的：

- 解除对共享实例的硬依赖
- 让插件边界更清楚

## 阶段 3：阅读状态联动

按需接这些能力：

- `readingModeBindingId`
- `sendReadingRelatedClassifications`
- `sendReadingRelatedChildren`
- `sendCitationMappings`

注意：

- 这些都应按需读取
- 不要一上来全量同步阅读树

## 阶段 4：研究对象与文献的双向视图

- 在 `mnresearch` 看“这个问题挂了哪些文献”
- 在 `mnliterature` 看“这篇文献支撑了哪些研究对象”

这一步再谈双向回写。

---

## 7. 主要风险

- `MNLiteratureInstance` 不存在
  - 处理：fallback 到索引 JSON
- 索引不存在或过旧
  - 处理：提示用户去 `mnliterature` 重建索引
- `loadLibraryIndex(recoverMd5)` 开销过大
  - 处理：主列表默认 `recoverMd5: false`
  - 只有 docmd5 精准匹配时再走 `findLiteratureByMd5`
- 两边字段漂移
  - 处理：`mnresearch` 必须自己做归一化层

---

## 8. 开发计划

### Task 1: 建立只读 adapter

- 读取 `MNLiteratureInstance`
- 实现主通道 / fallback 通道
- 做文献快照归一化

### Task 2: 打通 `mnresearch` Native -> WebView

- 新增 bridge action：加载文献列表
- 新增按 `docmd5` 查询当前文献

### Task 3: 研究侧最小 UI

- 文献搜索器
- 当前 PDF 对应文献提示
- 研究对象挂接文献
- 跳回 `mnliterature`

### Task 4: 回归与容错

- `mnliterature` 已打开 / 未打开
- 索引存在 / 不存在
- 当前 PDF 有 md5 / 无 md5
- 文献存在 / 不存在 / 多库命中

---

## 9. 最后结论

从工程和认知两边看，最对的做法不是“在 `mnresearch` 再做一个文献模块”，而是：

- 把 `mnliterature` 当文献真源
- 让 `mnresearch` 先读、再挂、再跳
- 等第一阶段读通以后，再补正式 response 协议和阅读状态联动

先把数据拿到手，再谈深度联动。顺序别反。
