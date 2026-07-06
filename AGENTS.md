# AGENTS.md — SkillS Manager

扫描本机多个 agent 已安装的 skill，汇总列出详细信息。

## 核心约束

- 功能：扫描 skill 清单 → 汇总信息（来源、说明、用法、命令），附带简体中文翻译，支持手动刷新
- 流程：**设计 → 验证 → 实现 → 审查**
- 必须编写并持续更新项目文档
- 输出格式：英文后始终附带简体中文翻译

## 开发命令

```bash
npm run dev       # tsx watch 热重载开发
npm run build     # tsc 编译
npm run build-exe # esbuild → SEA → exe
npm run dist      # 构建 exe + zip 打包
```

## 项目结构

```
src/
├── index.ts       # Express 服务器 (端口 3000/自定义)
├── scanner.ts     # 从 agents.json 读取配置，扫描 skill 目录
├── html.ts        # HTML 内联（开发时读文件）
public/index.html  # 单页前端（排序/搜索/弹窗/URL 记忆）
docs/              # 项目文档
agents.json        # Agent 配置文件
translations.json  # 英文→中文翻译对照表
build-exe.mjs      # 构建脚本（esbuild → SEA → exe）
```

## API

- `GET /api/skills` — 返回 skills + agents + scannedAt
- `POST /api/refresh` — 重新扫描 + fs.watch 自动刷新

## 工作区怪癖

- 无 CI、无 lint、无 `.editorconfig`
- exe 签名损坏（SEA 注入后），不影响运行

## 已实现功能

- 5 agent 扫描（opencode/codex/trae-cn/workbuddy/qoderworkcn），87 skill
- `agents.json` 驱动 agent 配置
- `translations.json` 驱动英译中
- 排序（4 列）、命令关键字搜索、详情弹窗、URL 参数记忆
- 1920×1080 全屏布局优化
- Standalone exe（Node.js SEA，零外部依赖）
- fs.watch 自动刷新、启动自动打开浏览器、自定义端口
