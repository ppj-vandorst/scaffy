import { spawnSync } from "node:child_process";
import { promises as fs, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const CLI = fileURLToPath(new URL("../dist/cli.js", import.meta.url));
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

let dir: string;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "scaffy-cli-"));
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

function scaffy(...args: string[]) {
  const r = spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8", stdio: "pipe" });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

describe("scaffy binary", () => {
  it("prints help and exits 0", () => {
    const r = scaffy("--help");
    expect(r.code).toBe(0);
    expect(r.stdout).toContain("Usage: scaffy [options]");
    expect(r.stdout).toContain("--preset <name>");
  });

  it("prints the package version", () => {
    const r = scaffy("--version");
    expect(r.code).toBe(0);
    expect(r.stdout.trim()).toBe(pkg.version);
  });

  it("lists presets tab-separated on stdout", () => {
    const r = scaffy("--list-presets");
    expect(r.code).toBe(0);
    expect(r.stdout).toMatch(/^node-cli-typescript\t\S/m);
  });

  it("installs non-interactively with --yes", async () => {
    const r = scaffy("--dir", dir, "--preset", "node-cli-typescript", "--description", "Does things.", "--yes");
    expect(r.code).toBe(0);
    expect(r.stdout).toContain(".ai/context/cli-conventions.md");
    expect(await fs.readFile(path.join(dir, "AGENTS.md"), "utf8")).toContain(
      `**${path.basename(dir)}**: Does things.`,
    );
    const manifest = JSON.parse(await fs.readFile(path.join(dir, ".ai/.scaffy.json"), "utf8"));
    expect(manifest.preset).toBe("node-cli-typescript");
  });

  it("rejects an unknown preset on stderr without writing", async () => {
    const r = scaffy("--dir", dir, "--preset", "nope", "--description", "x", "--yes");
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/^scaffy: Unknown preset "nope"\. Available: .*node-cli-typescript/);
    expect(await fs.readdir(dir)).toEqual([]);
  });

  it("requires --description with --yes", async () => {
    const r = scaffy("--dir", dir, "--yes");
    expect(r.code).toBe(1);
    expect(r.stderr).toBe("scaffy: --description is required with --yes\n");
    expect(await fs.readdir(dir)).toEqual([]);
  });

  it("rejects unknown flags", () => {
    const r = scaffy("--bogus");
    expect(r.code).toBe(1);
    expect(r.stderr).toContain("scaffy: Unknown option '--bogus'");
  });
});
