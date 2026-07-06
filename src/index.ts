import express from "express";
import { watch } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { scanSkills, loadAgents, type Skill, type AgentSource } from "./scanner.js";
import { HTML } from "./html.js";

const app = express();
const PORT = parseInt(process.env.PORT || process.argv[2] || "3000", 10);
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
  try { execSync(`start http://localhost:${PORT}`, { stdio: "ignore" }); } catch {}
});
