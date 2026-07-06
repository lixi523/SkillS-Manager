# 设计文档 — SkillS Manager

## 1. 系统架构

```
┌─────────────────────────────────────────────────┐
│                    Browser                       │
│         http://localhost:3000                    │
└──────────────────────┬──────────────────────────┘
                       │ HTTP (JSON / HTML)
┌──────────────────────▼──────────────────────────┐
│  Express Web Server (src/index.ts)               │
│  ┌────────────┐  ┌─────────────────────────────┐ │
│  │ Static     │  │ API Routes                  │ │
│  │ Files      │  │ GET  /api/skills            │ │
│  │ (public/)  │  │ POST /api/refresh           │ │
│  └────────────┘  └──────────┬──────────────────┘ │
└──────────────────────────────┼────────────────────┘
                               │
┌──────────────────────────────▼────────────────────┐
│  Skill Scanner (src/scanner.ts)                   │
│  ┌──────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │ Agent        │ │ Skill       │ │ Translator │ │
│  │ Detector     │ │ Parser      │ │ (online)   │ │
│  └──────────────┘ └─────────────┘ └────────────┘ │
└──────────────────────────────────────────────────┘
```

## 2. Agent 检测策略

### Agent 分类

| 分类 | 包含 Agent |
|------|-----------|
| 终端 CLI | OpenCode, Codex CLI, Claude Code, Aider, Qwen Code |
| IDE 插件 | Cursor, Windsurf, Cline, Copilot, 通义灵码, CodeBuddy, 文心快码, CodeGeeX |
| 桌面通用 | OpenClaw, QClaw, TRAE WORK, WORKBUDDY, QODERWORK |
| 云端自主 | Devin, Manus, OpenHands, Replit Agent, Hermes |

### 扫描策略

1. 遍历已知 Agent 的 skill 目录（目前支持 `opencode` 和 `codex`）
2. 按 skill 名称去重合并：同名 skill 在不同目录出现则标记为多 Agent 共享
3. 元数据从首次出现的目录读取（优先级：opencode → codex）

## 3. Skill 数据模型

```typescript
interface Skill {
  name: string;          // Skill 名称
  installedOn: string[]; // 已安装此 Skill 的 Agent 列表
  path: string;          // 文件系统路径
  description: string;   // 英文说明
  usage: string;         // 用法或触发条件
  commands?: string[];   // 相关命令
  descriptionZh: string; // 中文翻译
  usageZh: string;       // 中文翻译
}
```

## 4. GitHub 链接

每个 Skill 关联一个 GitHub 仓库链接。数据来源：
- 优先从 SKILL.md frontmatter 中的 `homepage` 或 `repository` 字段读取
- 其次从 `_meta.json` / `_skillhub_meta.json` 中获取
- 未找到则 GitHub 列显示为空（不展示链接图标）

## 5. API 设计

### GET /api/skills

返回所有 Skill 的 JSON 数组。

响应：
```json
{
  "skills": [...],
  "scannedAt": "2026-07-06T15:30:00Z"
}
```

### POST /api/refresh

重新扫描并返回更新后的列表。

## 5. 前端设计

单页应用，无需路由：
- **头部**：标题 + 刷新按钮 + 最后扫描时间
- **表格**：名称 | 已安装 Agent | 说明（简体中文） | 用法（简体中文） | 命令 | GitHub
- 说明和用法仅显示简体中文
- 表格支持按 Agent 筛选
- 刷新时显示加载状态

### Agent 筛选器

Agent 筛选下拉框按分类分组显示（终端 CLI / IDE 插件 / 桌面通用 / 云端自主），仅显示本机有安装记录的 Agent 分类组。

### 响应式断点

| 视口 | 行为 |
|------|------|
| > 768px | 完整布局，固定列宽 |
| ≤ 768px | 头部纵向堆叠、筛选栏堆叠、说明/用法列取消 max-width 限制 |
| ≤ 480px | 隐藏"上次更新"文本、缩小单元格内边距和字号 |
| 任意宽度 | 表格水平滚动（`min-width: 640px` + `overflow-x: auto`），小屏不换行破碎 |

## 6. 实现约束

- 文件只读模式，不修改任何 Skill 文件
- 中文翻译使用本地缓存 + 在线翻译 API
- ponytail: 初期中文翻译用静态映射表，后续集成翻译 API
