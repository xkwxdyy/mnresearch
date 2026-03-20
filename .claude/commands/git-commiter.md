# git-commiter

适用于 `mnresearch/` 这个独立 Git 仓库。

这里的提交、日志、推送，全部只针对当前子仓库完成，不和外层 `MN-Addon-develop` 共用，也不要顺手去处理其他插件。别犯那种“在子仓库里改完，结果跑到父仓库提交”的低级错误。

## 角色

你是 `MN Research` 项目的开发助手，也是这个子仓库的 Git 提交执行者。

默认行为：
- 自动分析当前子仓库改动
- 自动更新本仓库的 `CHANGELOG.md`
- 自动完成本仓库的 `git add`、`git commit`、`git push`
- 只有在真的卡住时才提问，比如冲突、权限失败、远程拒绝推送

## 1. 怎么进行 Git 操作

所有 Git 命令都必须在 `mnresearch/` 仓库上下文执行，推荐直接使用：

```bash
git -C mnresearch status
git -C mnresearch diff
git -C mnresearch add ...
git -C mnresearch commit -m "..."
git -C mnresearch push origin main
```

如果当前 shell 已经在 `mnresearch/` 目录内，也可以直接执行普通 `git` 命令，但核心原则不变：

- 只看 `mnresearch` 自己的 Git 状态
- 只提交 `mnresearch` 自己的文件
- 不处理外层仓库状态
- 不夹带其他插件目录

禁止操作：
- 不要在父仓库执行 `git add mnresearch`
- 不要把外层仓库和子仓库的提交混在一起
- 不要用“顺手一起提交”这种懒办法，容易把历史搞脏

## 2. Git 之前要怎么处理

提交前必须先完整分析当前子仓库改动，顺序别乱。

### 第一步：检查状态

先执行：

```bash
git -C mnresearch status
```

必须完整检查这几类内容：
- `Changes to be committed`
- `Changes not staged for commit`
- `Untracked files`
- `Deleted files`

不要只看一眼 staged 区就开冲。完整状态才是真相。

### 第二步：阅读改动

至少执行这些检查：

```bash
git -C mnresearch diff
git -C mnresearch diff --cached
```

需要时补充看具体文件，重点关注：
- `src/` 下的功能代码
- `dist/` 下的构建产物
- `src/mnaddon.json` 里的版本号
- `CHANGELOG.md` 是否需要补记录

### 第三步：判断是否需要先构建

如果改动涉及 `src/`，就要检查是否应同步更新 `dist/`。默认不要只提源码不提产物，除非项目当前约定明确说构建产物不入库。

也就是说：
- 改了 `src/*.js` / `src/*.html` / `src/mnaddon.json`
- 就要确认对应 `dist/` 是否也应更新

### 第四步：判断版本号是否需要变更

`mnresearch` 使用自己的版本号，读取位置优先看：

```bash
mnresearch/src/mnaddon.json
```

规则：
- 普通代码提交：默认不强制升级版本号
- 发布相关提交：需要同步更新版本号，并确保 `CHANGELOG.md` 对应
- 如果已经手动改了版本号，提交前必须确认日志条目和版本一致

## 3. 怎么提交日志

提交前必须更新 `mnresearch/CHANGELOG.md`。

### 日志要求

- 版本号：从 `src/mnaddon.json` 读取当前版本
- 时间：使用中国时区
- 格式：

```bash
TZ='Asia/Shanghai' date '+%Y-%m-%d %H:%M:%S'
```

- 记录的是这次提交真正做了什么，不要写空话
- 优先描述用户可感知变化，其次补技术实现

### 建议分类

- `🎉 重大新功能`
- `✨ 功能增强`
- `🐛 Bug 修复`
- `🔧 技术改进`
- `📚 文档更新`

### 推荐格式

```markdown
## vX.Y.Z (YYYY-MM-DD HH:mm:ss)

### ✨ 功能增强

#### 功能标题
- 改了什么
- 解决了什么问题
- 如果有必要，补一句实现方式
```

要求：
- 新条目写在最上面
- 版本号、时间、内容三者一致
- 不要把“修了点东西”这种废话写进日志

## 4. 怎么进行提交

### 标准流程

1. 检查状态

```bash
git -C mnresearch status
```

2. 检查 diff

```bash
git -C mnresearch diff
git -C mnresearch diff --cached
```

3. 更新 `CHANGELOG.md`

4. 按需构建，确保 `dist/` 同步

5. 只把当前要提交的文件加入暂存区

```bash
git -C mnresearch add CHANGELOG.md
git -C mnresearch add src/
git -C mnresearch add dist/
git -C mnresearch add package.json
git -C mnresearch add pnpm-lock.yaml
```

不要无脑 `git add .`，除非你已经确认整个仓库所有改动都属于这次提交。

6. 提交前再检查一次暂存区

```bash
git -C mnresearch diff --cached --name-only
```

7. 提交

```bash
git -C mnresearch commit -m "feat: ..."
```

8. 推送

```bash
git -C mnresearch push origin main
```

## Commit message 规则

优先使用这几类前缀：
- `feat:` 新功能
- `fix:` 修复问题
- `refactor:` 重构
- `docs:` 文档更新
- `chore:` 构建、脚本、杂项维护

建议风格：
- `feat: 支持研究策略多标签编辑`
- `fix: 修复时间线详情弹窗闪退`
- `refactor: 整理 focus 状态归一化逻辑`
- `docs: 更新研究建模说明`

如果这次提交明显是发布构建，也可以写得更明确：
- `chore: release v0.1.19`

## 执行原则

- 默认直接完成，不为小事反复确认
- 以 `mnresearch` 子仓库实际 Git 状态为准
- 提交内容必须和 `CHANGELOG.md` 对得上
- 如果发现工作区里混入无关文件，要主动排除，别一起端上去
- 如果遇到冲突、push 失败、认证失败，再汇报问题
