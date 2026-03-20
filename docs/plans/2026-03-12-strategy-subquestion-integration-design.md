# 策略分支与子问题一体化设计

**Date:** 2026-03-12

**Goal:** 把 `mnresearch` 里“策略分支”和“子问题”从当前几乎断开的两套结构，升级成一个真正可回流、可追踪、可视化的研究推进系统。

**Core Judgment:** 现在的问题不是“少一个统计字段”，而是研究建模错位。`strategy` 被当成问题下面的挂件，`child question` 被当成树上的孤儿。真实科研里，这两者必须互相转化、互相解释、互相回流，不然整个系统会假装在研究，实际上只是在堆卡片。

---

## 1. 先把病灶说透

当前模型里：

- `question` 有 `parentId`，所以能形成问题树。
- `strategy` 有 `questionId`，所以只能挂在某个问题下面。
- 两者之间唯一稳定交集，基本只有“同属这个问题”或者“子问题数量”。

这会直接导致 4 个严重后果：

1. 一个策略如果实际上已经演化成独立子问题，系统不知道。
2. 一个子问题解决之后，系统不知道它到底回流给了哪个策略、哪个判断、哪个障碍。
3. 工作台里“策略推进”和“子问题拆解”是两条平行宇宙，用户只能靠脑补维持上下文。
4. 生命周期判断是失真的。现在 `computeQuestionLifecycle()` 里把 `children` 只当数量，而不是研究结构的一部分。

科研里，一个子问题至少要回答下面 3 件事：

- 它是从哪个研究动作里长出来的。
- 它对母问题到底起什么作用。
- 它解决之后该如何回流，不然它只是另一个坑。

---

## 2. 三种方案，推荐第二种

### 方案 A: 轻量修补

给 `question` 增加几个字段：

- `sourceStrategyId`
- `relationToParent`
- `expectedContribution`
- `feedBackStatus`

优点：

- 改动小，迁移容易。
- 很快能让子问题不再完全悬空。

缺点：

- 关系表达太单线。
- 一个子问题如果同时承接“某策略导出”与“某判断验证”，模型会开始发臭。

### 方案 B: 混合式分支模型

保留现有 `question` / `strategy` 实体，但新增一层明确的 `branchLinks` 关系表，同时给子问题补上面向研究的角色字段。

优点：

- 不推翻现有存档。
- 能表达“策略生成子问题”“子问题回流母问题”“子问题服务于障碍拆解”这些关键关系。
- 前端可以很自然做分支图和回流提示。

缺点：

- 比方案 A 多一层关系维护。
- 需要在 store / core / render 三层同时补齐。

### 方案 C: 全图谱重构

把 `question`、`strategy`、`judgment`、`obstacle` 都抽象成统一 `researchNode`，再用 graph edge 连接。

优点：

- 理论最优。
- 长期扩展空间最大。

缺点：

- 对当前代码库来说太猛了。
- 会把这次要修的真问题，拖成一次系统重建。

**我的建议：直接上方案 B。** 这是最不傻的平衡点。够强，够稳，也配得上这个系统接下来继续长。

---

## 3. 推荐建模：从“问题树”升级成“问题树 + 分支关系网”

### 3.1 保留的主骨架

- `question.parentId` 继续保留，问题树仍然是全局导航主结构。
- `strategy.questionId` 继续保留，表示这条策略当前归属于哪个主问题工作台。
- `strategy.parentId` 继续只表示策略内部子分支，不再承担“子问题关系”的职责。

### 3.2 新增 `branchLinks`

新增顶层数组：

```js
branchLinks: [
  {
    id: "branch-1",
    sourceType: "strategy",
    sourceId: "s1",
    targetType: "question",
    targetId: "q1-2",
    relationType: "spawn_question",
    branchRole: "prerequisite",
    contributionType: "remove_obstacle",
    status: "active",
    note: "先解决方向离散化，否则主问题推不动",
    createdAt: "...",
    updatedAt: "..."
  }
]
```

推荐枚举：

- `relationType`
  - `spawn_question`
  - `link_existing_question`
  - `supports_parent_question`
  - `reframe_question`
  - `parallel_angle`
  - `tests_judgment`
- `branchRole`
  - `subproblem`
  - `prerequisite`
  - `reformulation`
  - `counterexample_track`
  - `tooling_track`
  - `special_case`
  - `parallel_angle`
- `contributionType`
  - `answer_parent`
  - `validate_judgment`
  - `remove_obstacle`
  - `produce_example`
  - `produce_tool`
  - `shrink_scope`
  - `challenge_assumption`
- `status`
  - `active`
  - `partial`
  - `fed_back`
  - `stale`
  - `abandoned`

### 3.3 子问题要补的研究语义

`question` 建议新增一个轻量字段：

```js
branchMeta: {
  parentRelationType: "prerequisite",
  feedBackStatus: "pending",
  feedBackSummary: "",
  successCriteria: "",
  originSummary: ""
}
```

这不是为了重复 `branchLinks`，而是为了让子问题本身在列表和卡片里能直接表达“我为什么存在”。

### 3.4 策略要补的分支意图

`strategy` 建议新增：

```js
branchIntent: "direct_attack" | "spawn_subquestion" | "parallel_angle" | "tooling_track" | "counterexample_track" | "reformulation_track",
outcomeMode: "stay_strategy" | "promoted_to_question" | "linked_question"
```

核心判断：

- 不是每个策略都该变成子问题。
- 但每个策略都该回答自己是不是“可能导出一个独立问题”。

---

## 4. 研究逻辑：子问题不是分叉而已，而是回流管道

子问题一旦创建，系统必须强制它带上“对母问题的用途”。推荐把创建流程里的默认语义做成 4 类：

1. `拆主问题`
   - 这是最标准的 subproblem。
   - 解决后直接推进母问题判断。

2. `拆障碍`
   - 子问题并不直接回答母问题，但它解决一个卡点。
   - 这类最常来自策略失败或阻塞。

3. `换视角`
   - 本质是另一个角度、等价表述、范围切分。
   - 它不是 subordinate proof lemma，而是 perspective branch。

4. `打样例 / 反例`
   - 子问题存在的目的，是构造一个能验证或推翻某判断的局部战场。

每个子问题都要有一个“回流条件”：

- 什么算这个分支阶段性完成？
- 完成后回写到哪里？
- 影响的是判断、策略、障碍，还是母问题状态？

如果没有回流条件，这个子问题默认就是未定义 branch，UI 应该给警告，而不是假装没事。

---

## 5. 前端设计：把“分支关系”从暗知识变成显式界面

### 5.1 不建议继续让“策略”和“子问题”分住两个世界

当前 `renderStrategyTab()` 是平铺列表，这太弱了。建议把这个区域升级成 **“策略与分支”工作台**，至少提供两种视图：

- `列表视图`
- `分支视图`

列表视图保留现有录入效率。

分支视图展示三列：

1. 母问题当前核心判断 / 核心障碍
2. 策略卡
3. 由策略导出的子问题 / 已链接子问题

每张策略卡上必须有 3 个显式动作：

- `继续作为策略`
- `升格为子问题`
- `关联已有子问题`

这样用户不用先自己想明白数据库结构，UI 直接帮他完成研究动作分类。

### 5.2 子问题卡新增“回流头部”

在问题工作台顶部和侧栏子节点上，都应该显示：

- `来自策略：XXX`
- `分支角色：前置子问题 / 反例分支 / 视角切换`
- `回流状态：未回流 / 部分回流 / 已回流`
- `解决后作用：拆障碍 / 验判断 / 收缩范围`

这块很关键。用户一眼就知道这个子问题不是孤儿。

### 5.3 侧栏树要补“关系提示”，不然还是假树

当前侧栏只显示标题和计数。建议对子问题节点增加一行轻提示：

- `源自：局部扇区模型`
- `角色：拆障碍`
- `回流：待完成`

如果某个子问题只有 `parentId`，却没有任何 branch relation，直接显示：

- `待补关系`

别客气，这就是数据缺口。

### 5.4 回流动作必须显式

当子问题状态改成 `resolved` 时，不要只改个状态。弹出一个轻量回流面板：

- 这次结果主要回流到：
  - `判断`
  - `策略`
  - `障碍`
  - `母问题结论`
- 回流摘要
- 是否同步将源策略标记为：
  - `promising`
  - `succeeded`
  - `failed`
  - `stale`

这一步会极大提升系统的科研真实性。

---

## 6. 生命周期和仪表盘也得改，不然只是换皮

`computeQuestionLifecycle()` 需要把“有效子问题”纳入判断，而不是只数 `children`。

新增统计维度：

- `derivedQuestionCount`
- `linkedQuestionCount`
- `orphanChildQuestionCount`
- `promotedStrategyCount`
- `fedBackChildQuestionCount`
- `staleBranchCount`

生命周期判断建议改成：

- 如果存在 `orphanChildQuestionCount > 0`，阶段提示应为“分支未接线”。
- 如果有 `spawn_subquestion` 的策略但没有活动子问题，提示“策略升格未完成”。
- 如果子问题已 `resolved` 但 `feedBackStatus !== fed_back`，提示“结果未回流”。

仪表盘建议新增一个模块：

- `分支健康度`
  - 已接线子问题
  - 待补关系子问题
  - 已回流分支
  - 悬空策略

这会比现在单纯数问题、数策略更像科研控制台。

---

## 7. 迁移策略：别炸旧数据，但要明确暴露脏数据

迁移原则：

- 不破坏现有 `questions` / `strategies` / `parentId`。
- 新版本自动创建 `branchLinks: []`。
- 对旧子问题，如果有 `parentId` 但没有 branch relation，不做猜测性强绑定，只打上 `needsTriage`。

建议迁移规则：

1. 旧数据加载时初始化 `branchLinks` 为空数组。
2. 所有有 `parentId` 的问题，派生一个 UI 层 `orphanChildQuestion` 标识，除非它有：
   - 来自策略的 `spawn_question` link，或
   - 明确的 `supports_parent_question` link。
3. 旧策略保持原样；只有用户主动“升格”或“关联”时才创建 link。

不要搞自动乱猜。研究关系一旦猜错，比没有还坏。

---

## 8. 对当前代码库的落地切分

### Phase 1: 数据与推导

- `scripts/research-data.js`
  - 新增 branch relation labels / intent labels
- `scripts/research-store.js`
  - `normalizeBranchLink`
  - `ADD_BRANCH_LINK`
  - `UPDATE_BRANCH_LINK`
  - `DELETE_BRANCH_LINK`
  - question / strategy 删除时清理 branch links
- `scripts/research-core.js`
  - `getBranchLinksForQuestion`
  - `getBranchLinksForStrategy`
  - `computeBranchHealth`
  - 生命周期接入 orphan / fed_back / stale 逻辑

### Phase 2: 关键交互

- `scripts/research-actions.js`
  - `promote-strategy-to-question`
  - `link-strategy-to-question`
  - `mark-question-fed-back`
  - `open-branch-link-modal`
- `scripts/research-render.js`
  - 把 `策略` tab 升级成 `策略与分支`
  - 增加 branch graph / branch list
  - 子问题回流面板
  - 侧栏树关系提示

### Phase 3: 样例和迁移可视化

- `scripts/research-sample-data.js`
  - 加入 2 到 4 条 `branchLinks`
  - 体现“策略生成子问题”“子问题回流母问题”

---

## 9. 最终交付标准

这个设计做完，至少要满足下面 6 条：

1. 新建子问题时，必须能说明它来自哪里、服务什么。
2. 策略可以一键升格为子问题，或者关联已有子问题。
3. 母问题能看到“哪些策略导出了哪些子问题”。
4. 子问题解决后，用户能显式完成回流。
5. 旧数据里所有“只有 parentId 的子问题”都会被标成待补关系，而不是继续装死。
6. 仪表盘和生命周期会把“悬空分支”当成系统问题暴露出来。

---

## 10. 一句话结论

这次别再把“策略”和“子问题”当成两个栏目了。真正该建的是一个 **研究分支系统**：策略负责发起推进，子问题负责承接深入，回流负责把局部突破重新送回母问题。没有这条闭环，研究系统再花哨，也只是记事本。
