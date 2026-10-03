import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = dirname(require.resolve("maplibre-gl/package.json"));
const outDir = join(root, "public", "vendor", "maplibre");

const files = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];

mkdirSync(outDir, { recursive: true });

for (const file of files) {
  const from = join(dist, "dist", file);
  const to = join(outDir, file);
  if (!existsSync(from)) {
    throw new Error(`Missing MapLibre file: ${from}`);
  }
  copyFileSync(from, to);
  console.log(`Copied ${file} -> public/vendor/maplibre/${file}`);
}
