import { copyFile, rm } from "node:fs/promises";

const out = new URL("../build/client/", import.meta.url);
await copyFile(new URL("404/index.html", out), new URL("404.html", out));
await rm(new URL("404", out), { recursive: true });
await rm(new URL("__spa-fallback.html", out), { force: true });
