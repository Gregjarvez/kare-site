import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const kare = resolve(process.env.KARE_REPO ?? new URL("../../Kare", import.meta.url).pathname);
const out = new URL("../app/sand/kare/", import.meta.url);

const files = [
  ["src/sand/constants.ts", "constants.ts"],
  ["src/sand/uniform-layout.ts", "uniform-layout.ts"],
  ["src/sand/grain-wgsl.ts", "grain-wgsl.ts"],
  ["src/sand/tray-wgsl.ts", "tray-wgsl.ts"],
  ["src/sand/scene-shader.ts", "scene-shader.ts"],
  ["src/sand/daylight.ts", "daylight.ts"],
  ["src/stones/marble-shader.ts", "marble-shader.ts"],
];

if (!existsSync(resolve(kare, "src/sand/scene-shader.ts"))) {
  if (existsSync(new URL("scene-shader.ts", out))) process.exit(0);
  console.error(`Kare's shaders not found at ${kare}; set KARE_REPO to the app's checkout.`);
  process.exit(1);
}

await mkdir(out, { recursive: true });
for (const [from, to] of files) {
  const text = (await readFile(resolve(kare, from), "utf8")).replace("'@/stones/marble-shader'", "'./marble-shader'");
  await writeFile(new URL(to, out), `// Copied from Kare's ${from} by scripts/sync-kare-shaders.mjs; edit it there.\n${text}`);
}

const carving = await readFile(resolve(kare, "src/stones/marble-carving.ts"), "utf8");
const constant = (name) => carving.match(new RegExp(`export const ${name} = ([0-9.]+);`))[1];
await writeFile(
  new URL("marble-carving.ts", out),
  `// The constants of Kare's src/stones/marble-carving.ts that its marble shader reads.\nexport const FACE = ${constant("FACE")};\nexport const CARVINGS = ${constant("CARVINGS")};\nexport const CARVE_DEPTH = ${constant("CARVE_DEPTH")};\n`,
);
