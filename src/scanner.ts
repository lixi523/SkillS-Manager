import { readFileSync, readdirSync, existsSync } from "fs";
import { homedir } from "os";
import { join, resolve } from "path";

let translations: Record<string, string> = {};
try {
  translations = JSON.parse(readFileSync("translations.json", "utf-8"));
} catch {}

export interface Skill {
  name: string;
  installedOn: string[];
  path: string;
  description: string;
  descriptionZh: string;
  usage: string;
  usageZh: string;
  commands: string[];
  githubUrl: string;
}

export interface AgentSource {
  id: string;
  label: string;
  path: string;
}

function resolvePath(p: string): string {
  if (!p) return "";
  return p.startsWith("~") ? join(homedir(), p.slice(1)) : resolve(p);
}

export function loadAgents(configPath: string): AgentSource[] {
  try {
    const raw = readFileSync(configPath, "utf-8");
    const list = JSON.parse(raw) as { id: string; label?: string; path?: string }[];
    return list.map((a) => ({
      id: a.id,
      label: a.label || a.id,
      path: resolvePath(a.path || ""),
    }));
  } catch {
    return [];
  }
}

function parseFrontmatter(filePath: string): Record<string, unknown> {
  const raw = readFileSync(filePath, "utf-8").replace(/\r\n/g, "\n");
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const body = match[1];
  const result: Record<string, unknown> = {};
  const lines = body.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const keyMatch = line.match(/^(\w+):\s*(.*)/);
    if (keyMatch) {
      const key = keyMatch[1];
      let val: unknown = keyMatch[2].trim();
      if (val === "") {
        const blockLines: string[] = [];
        i++;
        while (i < lines.length) {
          const bl = lines[i];
          if (bl.match(/^\w+:/) || bl.startsWith("---")) break;
          const trimmed = bl.replace(/^(\s{2}|\t)/, "").trimEnd();
          if (trimmed) blockLines.push(trimmed);
          i++;
        }
        val = blockLines.join("\n");
      } else if (val === ">") {
        const blockLines: string[] = [];
        i++;
        while (i < lines.length) {
          const bl = lines[i];
          if (bl.match(/^\w+:/) || bl.startsWith("---") || bl.startsWith("- ")) break;
          const trimmed = bl.replace(/^(\s{2}|\t)/, "").trimEnd();
          if (trimmed) blockLines.push(trimmed);
          i++;
        }
        val = blockLines.join("\n");
      }
      result[key] = val;
    }
    i++;
  }
  return result;
}

function extractDescription(meta: Record<string, unknown>): { en: string; zh: string } {
  const en = (meta.description as string) || (meta.desc as string) || "";
  const zh = (meta.description_zh as string) || (meta.desc_zh as string) || "";
  return { en, zh };
}

function extractGithubUrl(meta: Record<string, unknown>): string {
  const candidates: string[] = [];
  for (const val of Object.values(meta)) {
    if (typeof val === "string") {
      const m = val.match(/homepage:\s*(https?:\/\/[^\s]+)/);
      if (m) candidates.push(m[1]);
      const m2 = val.match(/repository:\s*(https?:\/\/[^\s]+)/);
      if (m2) candidates.push(m2[1]);
    }
  }
  const standalone = [meta.homepage, meta.repository, meta.url].find(
    (v): v is string => typeof v === "string" && v.startsWith("http")
  );
  return standalone || candidates[0] || "";
}

function extractCommands(skillDir: string): string[] {
  const cmds: string[] = [];
  const metaPath = join(skillDir, "_skillhub_meta.json");
  if (existsSync(metaPath)) {
    try {
      const meta = JSON.parse(readFileSync(metaPath, "utf-8"));
      const label = meta.commands?.[0]?.command || meta.label || meta.name;
      if (label) cmds.push(label);
    } catch { /* ignore */ }
  }
  const skPath = join(skillDir, "SKILL.md");
  if (existsSync(skPath)) {
    const raw = readFileSync(skPath, "utf-8").replace(/\r\n/g, "\n");
    const codeBlocks = raw.match(/```[\s\S]*?```/g) || [];
    for (const block of codeBlocks) {
      const lines = block.split("\n");
      if (lines.length < 3) continue;
      const lang = lines[0].replace("```", "").trim();
      if (["bash", "sh", "shell", "powershell", "cmd"].includes(lang) || lang === "") {
        for (let j = 1; j < lines.length - 1; j++) {
          const cmd = lines[j].replace(/^[\s$>]*/, "").trim();
          if (cmd && !cmd.startsWith("#") && !cmd.startsWith("//")) {
            cmds.push(cmd);
          }
        }
      }
    }
  }
  return [...new Set(cmds)].slice(0, 5);
}

function extractUsage(meta: Record<string, unknown>): { en: string; zh: string } {
  const triggers = meta.triggers as Record<string, unknown> | undefined;
  const en: string[] = [];
  const zh: string[] = [];
  if (triggers) {
    for (const val of Object.values(triggers)) {
      if (typeof val === "string") {
        if (/[\u4e00-\u9fff]/.test(val)) zh.push(val);
        else en.push(val);
      } else if (typeof val === "object") {
        const items = Object.values(val as Record<string, unknown>).flatMap((v) =>
          typeof v === "string" ? [v] : []
        );
        for (const item of items) {
          if (/[\u4e00-\u9fff]/.test(item)) zh.push(item);
          else en.push(item);
        }
      }
    }
  }
  return {
    en: en.length > 5 ? en.slice(0, 5).join("; ") + "..." : en.join("; "),
    zh: zh.length > 5 ? zh.slice(0, 5).join("；") + "..." : zh.join("；"),
  };
}

function scanAgentDir(dir: string): Set<string> {
  const found = new Set<string>();
  if (!dir || !existsSync(dir)) return found;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (existsSync(join(dir, entry.name, "SKILL.md"))) found.add(entry.name);
  }
  return found;
}

function readSkillMeta(skillName: string, dirs: { agentId: string; dir: string }[]): Skill | null {
  for (const { agentId, dir } of dirs) {
    if (!dir) continue;
    const skillDir = join(dir, skillName);
    const skPath = join(skillDir, "SKILL.md");
    if (!existsSync(skPath)) continue;
    try {
      const meta = parseFrontmatter(skPath);
      const name = (meta.name as string) || skillName;
      const desc = extractDescription(meta);
      const usage = extractUsage(meta);
      let descZh = desc.zh || translations[name] || translations[skillName] || "";
      let usageZh = usage.zh;
      if (!descZh && desc.en) descZh = desc.en;
      if (!usageZh && usage.en) usageZh = usage.en;
      const githubUrl = extractGithubUrl(meta);
      const commands = extractCommands(skillDir);
      return {
        name,
        installedOn: [],
        path: skillDir,
        description: desc.en || descZh,
        descriptionZh: descZh,
        usage: usage.en || usageZh,
        usageZh,
        commands,
        githubUrl,
      };
    } catch {
      continue;
    }
  }
  return null;
}

export function scanSkills(agents: AgentSource[]): Skill[] {
  const skillAgents = new Map<string, string[]>();
  const agentDirs = agents.filter((a) => a.path).map((a) => ({ agentId: a.id, dir: a.path }));

  for (const { agentId, dir } of agentDirs) {
    const skills = scanAgentDir(dir);
    for (const s of skills) {
      if (!skillAgents.has(s)) skillAgents.set(s, []);
      skillAgents.get(s)!.push(agentId);
    }
  }

  const result: Skill[] = [];
  for (const [skillName, installedOn] of skillAgents) {
    const skill = readSkillMeta(skillName, agentDirs);
    if (skill) {
      skill.installedOn = installedOn;
      result.push(skill);
    }
  }
  result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}
