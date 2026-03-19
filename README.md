# MN Research

`MN Research` 是一个面向 MarginNote 4 的研究工作台插件。

它的目标不是做“又一个笔记面板”，而是在 MarginNote 里提供一套更适合研究推进的工作流，包括：

- 研究面板与独立工作区
- 问题、策略、分支关系与时间线组织
- 研究数据的导入、导出与备份
- 与 `mnliterature` 的阅读模式联动

## 当前状态

这个仓库正在从旧实现迁移到新的标准打包工程。

- 已完成：基础打包结构、版本管理脚本、GitHub Actions 构建发布流程
- 迁移中：插件主逻辑、Web 面板、研究数据模型与桥接代码
- 当前版本不代表功能已完整可用

如果你是来看成品的，现在还没到那个阶段；如果你是来看迁移过程和后续演进，这就是对的仓库。

## 开发

安装依赖：

```bash
pnpm install
```

打包调试包：

```bash
pnpm dev
```

打包发布包：

```bash
pnpm build
```

构建产物是仓库根目录下的 `.mnaddon` 文件，可直接导入 MarginNote 4 测试。

## 版本命令

```bash
pnpm version:patch
pnpm version:minor
pnpm version:major
```

这些命令会同时更新 `package.json` 和 `src/mnaddon.json`。如果工作区干净，还会自动创建 commit 和 tag。

## 发布

推送版本 tag 后，GitHub Actions 会自动构建并上传 `.mnaddon` 到 GitHub Releases：

```bash
git push
git push --tags
```

## 目录

- `src/`: MarginNote 插件入口与源码
- `scripts/`: 构建、打包、版本脚本
- `.github/workflows/ci.yml`: tag 构建与 Release 发布

## 开发注意

- 先读 [AGENTS.md](./AGENTS.md)
- MarginNote 插件运行在 JavaScriptCore，不是浏览器，也不是 Node.js
- `JSB.require(...)` 只允许出现在 `src/main.js`

## License

[MIT](./LICENSE)
