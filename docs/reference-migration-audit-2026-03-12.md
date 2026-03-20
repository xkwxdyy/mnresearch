# Reference Migration Audit

Date: 2026-03-12

## Verdict

`reference/` 的核心前端功能已经完成迁移，当前 JS 版已具备可替代性。

因此：
- `reference/` 中的 React/Next 参考实现已不再作为运行时依赖
- 可以删除 `reference/` 以避免双实现继续分叉

## Migrated Capability Checklist

已迁移并落地到当前 JS 版的能力：

- 页面骨架：
  问题树侧栏、研究驾驶舱、问题工作台、右下浮动专注会话

- 工作台对象流：
  研究问题、问题表述、工作判断、策略分支、样例与反例、障碍、局部认识

- 专注会话流：
  开始、暂停、继续、完成、笔记追加、对象绑定、对象关联、总结回流

- 驾驶舱决策层：
  当前焦点、统计卡片、最近专注会话、最近活动、建议下一步

- store 能力：
  `getQuestionTree`
  `getQuestionWithRelations`
  `getSnapshot`
  `getCurrentFocus`
  `startFocus`
  `addFocusNote`
  `pauseFocus`
  `resumeFocus`
  `completeFocus`
  `linkItemToFocus`

- 交互增强：
  侧栏折叠
  当前问题下搜索绑定专注对象
  列表内直接“专注此项”
  专注会话中继续关联文献 / 样例 / 局部认识 / 判断 / 策略 / 障碍

## Product-Level Conclusion

当前主链路已经收口为：

研究问题
-> 问题表述
-> 工作判断
-> 策略分支
-> 障碍
-> 专注会话
-> 会话总结
-> 回流沉淀
-> 驾驶舱决策

这套生命周期对数学科研工作者是成立的，且术语已经统一到：

- 问题
- 问题表述
- 工作判断
- 策略分支
- 样例与反例
- 障碍
- 局部认识
- 专注会话

## Cleanup Decision

现在保留 `reference/` 的价值已经低于其维护成本。

建议：
- 删除整个 `reference/`
- 以后只维护 JS 版
- 若需要追溯迁移背景，以本文件和当前代码为准
