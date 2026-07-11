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

```text
SkillManager.exe [port] [options]

  port            自定义端口 (默认 3000)，等价于环境变量 PORT
  -h, --help      显示帮助
  --no-open       启动后不自动打开浏览器

示例:
  SkillManager.exe 4000        # 4000 端口启动
  PORT=8080 SkillManager.exe   # 用环境变量指定端口
  SkillManager.exe --no-open   # 启动但不自动开浏览器
```

- **Port**: Default 3000. Override: `SkillManager.exe 4000` or `env PORT=4000`
- **Package**: Run `npm run dist` to produce `SkillManager.zip` (exe + configs)

## Code Signing / 数字签名

The standalone exe is built via Node.js SEA. It is delivered **unsigned** — the
original node.exe Authenticode signature is intentionally stripped during the
build (`tools/strip-sig.py`). Windows SmartScreen may show a warning on first
run; click "Run anyway" / "仍要运行" to proceed. To ship a signed binary, obtain
a code-signing certificate and run `signtool sign /fd SHA256 SkillManager.exe`
after `npm run build-exe`.

## Adding Translations / 新增翻译

When new skills appear with English-only descriptions:

```bash
# start the exe, then:
node tools/extract-untranslated.mjs          # -> tools/untranslated-draft.json
# open it, fill in Simplified Chinese, merge into translations.json
npm run dist                                  # rebuild exe + zip
```

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
- [Release](docs/release.md)
