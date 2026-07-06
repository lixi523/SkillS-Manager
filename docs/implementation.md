# 实现文档 — SkillS Manager

## 项目结构

```
SkillS Manager/
├── src/
│   ├── index.ts          # Express 服务器 + API 路由
│   ├── scanner.ts        # Skill 扫描器（解析 SKILL.md frontmatter）
│   └── html.ts           # HTML 内联（开发时从 public/ 读取）
├── public/
│   └── index.html        # 前端单页应用
├── docs/
│   ├── requirements.md   # 需求分析
│   ├── design.md         # 设计文档
│   ├── implementation.md # 实现文档（本文）
│   └── test-report.md    # 测试报告
├── agents.json           # Agent 配置文件（手动添加名称和路径）
├── translations.json     # 英译中对照表
├── build-exe.mjs         # 构建脚本（esbuild → SEA → exe）
├── package.json
├── tsconfig.json
├── .gitignore
├── README.md
└── AGENTS.md
```

## 核心设计

### 配置驱动

- `agents.json` — 用户可手动编辑的 Agent 清单，每个条目含 `id`、`label`、`path`（支持 `~` 开头）
- `translations.json` — 英文描述的简体中文翻译对照表
- 两个文件放在 exe 同目录即可生效

### scanner.ts

- `loadAgents(configPath)` — 从 `agents.json` 加载 Agent 清单
- `scanSkills(agents)` — 遍历所有 Agent 的 skill 目录，合并同名 skill
- 解析每个 SKILL.md 的 YAML frontmatter（纯正则，零依赖）
- 提取：name、description（中/英）、commands、GitHub URL
- GitHub URL 来源：frontmatter 中的 `metadata.openclaw.homepage` 或 `homepage`/`repository` 字段
- 翻译查找：先查 `description_zh`，再查 `translations.json`，最后回退英文

### index.ts

- Express 5 服务器
- 默认端口 3000，支持 `PORT` 环境变量或命令行参数（`SkillManager.exe 4000`）
- `GET /api/skills` — 返回 skills + agents + 扫描时间
- `POST /api/refresh` — 重新扫描并返回
- 启动时自动扫描 + fs.watch 监听 skill 目录变化自动刷新
- 启动后自动打开浏览器

### 前端 (index.html)

- 单页应用，无前端框架依赖
- 表格展示：名称 | 已安装 Agent | 说明 | 命令 | GitHub
- 搜索：名称/说明搜索 + 命令关键字搜索
- Agent 下拉：平铺列表，仅显示有 skill 的 Agent
- 排序：点击表头按名称/Agent 数/说明/命令数排序
- 详情弹窗：点击行弹出完整信息（中文说明、英文原文、命令列表、路径、GitHub）
- URL 参数记忆：搜索条件/排序状态记录在 URL query string 中，刷新不丢失
- 响应式布局（3 个断点）

### 构建

- `npm run build-exe` — esbuild 打包为单 CJS 文件 → Node.js SEA blob → 注入 node.exe
- `npm run dist` — 构建 exe + 打包为 zip（含 agents.json + translations.json）
- 产物：`SkillManager.exe`（~93MB，包含 Node.js 运行时）

## 开发命令

```bash
npm run dev       # tsx watch 热重载开发
npm run build     # tsc 编译
npm run build-exe # 构建 standalone exe（esbuild → SEA）
npm run dist      # 构建 exe + zip 打包
```
