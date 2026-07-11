import { readFileSync, cpSync, rmSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { build } from "esbuild";
import { join } from "path";

// Read HTML to embed in the exe
const html = readFileSync("public/index.html", "utf-8");

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "cjs",
  outfile: "dist/bundle.cjs",
  plugins: [
    {
      name: "inline-html",
      setup(build) {
        // Intercept the html.ts module and inline the HTML content
        build.onResolve({ filter: /html\.(ts|js)$/ }, (args) => {
          if (args.path.endsWith("html.ts") || args.path.endsWith("html.js")) {
            return { path: args.path, namespace: "html-module" };
          }
        });
        build.onLoad({ filter: /.*/, namespace: "html-module" }, () => ({
          contents: `export const HTML = ${JSON.stringify(html)};`,
          loader: "js",
        }));
      },
    },
  ],
});

// Create SEA config
writeFileSync(
  "dist/sea-config.json",
  JSON.stringify({
    main: "dist/bundle.cjs",
    output: "dist/sea-prep.blob",
    disableExperimentalSEAWarning: true,
  })
);
execSync("node --experimental-sea-config dist/sea-config.json", { stdio: "inherit" });

// Copy node.exe and inject blob
const nodePath = process.execPath;
const seaExe = "SkillManager.exe";
cpSync(nodePath, seaExe);

// Strip the original (now-invalid) Authenticode signature before injection.
// This avoids the "signature seems corrupted" warning and SmartScreen issues.
try {
  execSync(`python tools/strip-sig.py ${seaExe}`, { stdio: "inherit" });
} catch {
  console.log("strip-sig skipped (python unavailable) — exe may show signature warning");
}

writeFileSync(
  "dist/inject.cjs",
  `const { inject } = require("postject");
const { readFileSync } = require("fs");
inject("${seaExe}", "NODE_SEA_BLOB", readFileSync("dist/sea-prep.blob"), { sentinelFuse: "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2" });
`
);
execSync("node dist/inject.cjs", { stdio: "inherit" });
rmSync("dist/inject.cjs");

try { rmSync(seaExe + ".sig"); } catch {}

console.log("Done: " + seaExe);
