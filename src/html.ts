import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = join(__dirname, "..", "public", "index.html");

export const HTML: string = (() => {
  try { return readFileSync(htmlPath, "utf-8"); }
  catch { return ""; }
})();
