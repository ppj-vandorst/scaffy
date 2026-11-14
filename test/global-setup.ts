import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

/** Builds dist/ once so the end-to-end tests run the real binary. */
export default function setup(): void {
  const tsc = createRequire(import.meta.url).resolve("typescript/bin/tsc");
  execFileSync(process.execPath, [tsc], { stdio: "inherit" });
}
