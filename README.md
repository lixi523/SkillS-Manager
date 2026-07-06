# SkillS Manager

Scan multiple AI agent skill directories on your machine, aggregate installed skills into a single web dashboard with details, search, sort, and Simplified Chinese translation.

扫描本机多个 AI Agent 已安装的 Skill，汇总为统一的 Web 看板，支持搜索、排序和简体中文翻译。

## Features / 功能

- **Multi-agent scan** — Scans skill directories from opencode, codex, trae-cn, workbuddy, qoderworkcn, and any other agents you configure
- **87 skills detected** (on this machine) with full details: description (CN/EN), commands, GitHub links, installed agents
- **Simplified Chinese** — All English descriptions are translated to 简体中文
- **Sortable columns** — Click headers to sort by name, agent count, description, or commands
- **Command search** — Filter skills by command keywords
- **Detail modal** — Click any skill row to view full info including the English original
- **URL state** — Search, filter, and sort preserved in the URL across page refreshes
- **Auto-refresh** — Watches skill directories for changes and updates automatically
- **Config-driven** — Edit `agents.json` to add/remove agents; edit `translations.json` for translations
- **Standalone exe** — No Node.js installation needed; just `SkillManager.exe`

## Quick Start / 快速开始

### Option A: Standalone EXE

1. Download `SkillManager.zip`
2. Extract and run `SkillManager.exe`
3. Open `http://localhost:3000` in your browser

### Option B: From Source

```bash
npm install
npm run dev       # Development with hot reload
npm run build-exe # Build standalone exe
npm run dist       # Build exe + zip package
```

## Configuration / 配置

### agents.json

Edit this file to add or remove agent skill directories:

```json
[
  { "id": "my-agent", "label": "My Agent", "path": "~/.my-agent/skills" }
]
```

Place the file next to `SkillManager.exe` (or in the project root for dev mode).

### translations.json

Contains Simplified Chinese translations for English skill descriptions. Auto-loaded at startup. If missing, English originals are shown.

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Web dashboard |
| `/api/skills` | GET | JSON: all skills + agents + scan time |
| `/api/refresh` | POST | Re-scan and return updated data |

## Usage / 用法

- **Port**: Default 3000. Override: `SkillManager.exe 4000` or `env PORT=4000`
- **Package**: Run `npm run dist` to produce `SkillManager.zip` (exe + configs)

## Tech Stack / 技术栈

- **Backend**: Node.js + Express 5 + TypeScript
- **Frontend**: Vanilla JS single-page app (no frameworks)
- **Bundling**: esbuild → CJS bundle → Node.js Single Executable Application (SEA)
- **Dependencies**: express only

## Project Docs / 项目文档

See the `docs/` directory:
- [Requirements](docs/requirements.md)
- [Design](docs/design.md)
- [Implementation](docs/implementation.md)
- [Test Report](docs/test-report.md)
