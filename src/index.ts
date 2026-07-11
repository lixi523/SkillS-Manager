import express from "express";
import { watch } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { scanSkills, loadAgents, type Skill, type AgentSource } from "./scanner.js";
import { HTML } from "./html.js";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`SkillS Manager - 本机 Agent Skill 清单看板

用法:
  SkillManager.exe [port] [options]

参数:
  port            自定义端口 (默认 3000)，等价于环境变量 PORT

环境变量:
  PORT            监听端口

选项:
  -h, --help      显示本帮助
  --no-open       启动后不自动打开浏览器

示例:
  SkillManager.exe 4000        # 在 4000 端口启动
  PORT=8080 SkillManager.exe   # 用环境变量指定端口
  SkillManager.exe --no-open   # 启动但不自动开浏览器

配置文件 (放在 exe 同目录):
  agents.json         Agent 名称和 skill 目录路径
  translations.json   英文说明的简体中文翻译`);
  process.exit(0);
}

const app = express();
const portArg = process.argv[2] && /^\d+$/.test(process.argv[2]) ? process.argv[2] : undefined;
const PORT = parseInt(process.env.PORT || portArg || "3000", 10);
const NO_OPEN = process.argv.includes("--no-open");
const configPath = join(process.cwd(), "agents.json");

let agents: AgentSource[] = [];
let skills: Skill[] = [];
let scannedAt = "";

function refresh() {
  agents = loadAgents(configPath);
  skills = scanSkills(agents);
  scannedAt = new Date().toISOString();
  console.log(`Scanned ${skills.length} skills from ${agents.filter(a => a.path).length} agents at ${scannedAt}`);
}

// Watch agent skill directories for changes and auto-refresh
const watched = new Set<string>();
function startWatch() {
  for (const a of agents) {
    if (!a.path || watched.has(a.path)) continue;
    watched.add(a.path);
    try {
      watch(a.path, { recursive: true }, (_event, filename) => {
        if (filename && (filename.endsWith("SKILL.md") || filename.endsWith("_skillhub_meta.json"))) {
          console.log(`Change detected: ${filename}. Refreshing...`);
          refresh();
        }
      });
    } catch {}
  }
}

app.get("/", (_req, res) => {
  res.type("html").send(HTML);
});

app.get("/api/skills", (_req, res) => {
  res.json({ skills, agents, scannedAt });
});

app.post("/api/refresh", (_req, res) => {
  refresh();
  res.json({ skills, agents, scannedAt });
});

refresh();
startWatch();

app.listen(PORT, () => {
  console.log(`SkillS Manager running at http://localhost:${PORT}`);
  if (!NO_OPEN) { try { execSync(`start http://localhost:${PORT}`, { stdio: "ignore" }); } catch {} }
});
