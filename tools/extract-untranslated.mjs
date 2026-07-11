#!/usr/bin/env node
/**
 * Extract skills that still show English descriptions and emit a draft
 * translations.json ready for translation.
 *
 * Usage:
 *   node tools/extract-untranslated.mjs [skillManagerUrl]
 *
 * Default URL: http://localhost:3000/api/skills
 *
 * Output: writes tools/untranslated-draft.json containing only the
 * skill names + their English description. Open it, fill in the Chinese
 * text, merge into translations.json, and rebuild the exe.
 */
import { writeFileSync } from "fs";

const url = process.argv[2] || "http://localhost:3000/api/skills";

const res = await fetch(url);
const data = await res.json();

const need = data.skills.filter(
  (s) => s.descriptionZh === s.description && !/[\u4e00-\u9fff]/.test(s.description)
);

const draft = {};
for (const s of need) draft[s.name] = s.description;

const out = "tools/untranslated-draft.json";
writeFileSync(out, JSON.stringify(draft, null, 2) + "\n", "utf-8");
console.log(`Found ${need.length} English-only skills. Draft written to ${out}`);
