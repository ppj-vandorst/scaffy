import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { install, listPresets, type InstallOptions } from "../src/install.js";
import { upsertManagedSection } from "../src/managed-section.js";

let dir: string;

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), "scaffy-test-"));
});
afterEach(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

const opts = (over: Partial<InstallOptions> = {}): InstallOptions => ({
  targetDir: dir,
  projectName: "orders",
  description: "Manages customer orders. Second sentence.",
  preset: "java-spring-hexagonal",
  symlinks: true,
  version: "0.0.0-test",
  now: new Date("2026-01-01T00:00:00Z"),
  ...over,
});

const read = (rel: string) => fs.readFile(path.join(dir, rel), "utf8");

describe("install", () => {
  it("lays the preset over the base layer", async () => {
    const report = await install(opts());

    expect(report.created).toEqual(
      expect.arrayContaining([
        ".ai/INDEX.md",
        ".ai/context/overview.md",
        ".ai/context/architecture.md",
        ".ai/prompts/onboard.md",
        ".ai/prompts/review-architecture.md",
        ".ai/skills/update-context/SKILL.md",
        ".ai/skills/add-use-case/SKILL.md",
      ]),
    );
    expect(await read(".ai/context/architecture.md")).toContain("hexagonal");
    expect(await read(".ai/context/overview.md")).toContain("Manages customer orders. Second sentence.");
  });

  it("installs the writing skills and rules in the base layer", async () => {
    const report = await install(opts({ preset: "none" }));

    expect(report.created).toEqual(
      expect.arrayContaining([
        ".ai/context/code-comments.md",
        ".ai/context/writing-style.md",
        ".ai/skills/create-pr/SKILL.md",
        ".ai/skills/write-documentation/SKILL.md",
      ]),
    );
    const context = await read(".ai/context/INDEX.md");
    expect(context).toContain("- [code-comments.md](code-comments.md): Read before writing or editing code comments");
    expect(context).toContain("- [writing-style.md](writing-style.md): Read before writing prose");
    const skills = await read(".ai/skills/INDEX.md");
    expect(skills).toContain("- [create-pr](create-pr/SKILL.md): Open a pull request");
    expect(skills).toContain("- [write-documentation](write-documentation/SKILL.md): Write or edit documentation");
    expect(await read("AGENTS.md")).toContain("follow the `write-documentation` skill");
  });

  it("uses the stub architecture for the none preset", async () => {
    await install(opts({ preset: "none" }));
    expect(await read(".ai/context/architecture.md")).toContain("Not filled in yet");
    await expect(read(".ai/skills/add-use-case/SKILL.md")).rejects.toThrow();
  });

  it("installs the node-cli-typescript preset with its context and skills", async () => {
    const report = await install(opts({ preset: "node-cli-typescript" }));

    expect(report.created).toEqual(
      expect.arrayContaining([
        ".ai/context/architecture.md",
        ".ai/context/cli-conventions.md",
        ".ai/skills/add-command/SKILL.md",
        ".ai/skills/review-architecture/SKILL.md",
      ]),
    );
    expect(await read(".ai/context/architecture.md")).toContain("dependency-cruiser");
    expect(await read(".ai/context/INDEX.md")).toContain("- [cli-conventions.md](cli-conventions.md)");
    const skills = await read(".ai/skills/INDEX.md");
    expect(skills).toContain("- [add-command](add-command/SKILL.md)");
    expect(skills).toContain("- [review-architecture](review-architecture/SKILL.md)");
    await expect(read(".ai/prompts/review-architecture.md")).rejects.toThrow();
  });

  it("rejects an unknown preset", async () => {
    await expect(install(opts({ preset: "nope" }))).rejects.toThrow(/Unknown preset/);
  });

  it("writes indexes from frontmatter descriptions", async () => {
    await install(opts());
    const context = await read(".ai/context/INDEX.md");
    expect(context).toMatch(/- \[architecture\.md\]\(architecture\.md\): Read before adding classes/);
    expect(context).not.toContain("INDEX.md)");
    const skills = await read(".ai/skills/INDEX.md");
    expect(skills).toContain("- [update-context](update-context/SKILL.md): Refresh the project context");
    expect(skills).toContain("- [add-use-case](add-use-case/SKILL.md)");
    expect(await read(".ai/prompts/INDEX.md")).toContain("- [onboard](onboard.md)");
  });

  it("writes managed sections into new AGENTS.md and CLAUDE.md", async () => {
    await install(opts());
    const agents = await read("AGENTS.md");
    expect(agents).toContain("<!-- scaffy:start -->");
    expect(agents).toContain("**orders**: Manages customer orders.");
    expect(agents).not.toContain("Second sentence");
    expect(await read("CLAUDE.md")).toContain("@AGENTS.md");
  });

  it("keeps user content in an existing AGENTS.md", async () => {
    await fs.writeFile(path.join(dir, "AGENTS.md"), "# My rules\n\nBe nice.\n");
    await install(opts());
    const agents = await read("AGENTS.md");
    expect(agents).toContain("Be nice.");
    expect(agents.indexOf("scaffy:start")).toBeLessThan(agents.indexOf("Be nice."));
  });

  it("is safe to re-run: never overwrites .ai files and keeps installedAt", async () => {
    await install(opts());
    await fs.writeFile(path.join(dir, ".ai/context/overview.md"), "edited by hand\n");

    const report = await install(opts({ now: new Date("2027-01-01T00:00:00Z"), description: "Changed." }));

    expect(report.created).toEqual([]);
    expect(await read(".ai/context/overview.md")).toBe("edited by hand\n");
    expect(report.indexes.every((i) => i.result === "unchanged")).toBe(true);
    expect(report.sections.find((s) => s.path === "CLAUDE.md")?.result).toBe("unchanged");
    expect(report.sections.find((s) => s.path === "AGENTS.md")?.result).toBe("updated");
    expect(report.symlinks.created).toEqual([]);
    const manifest = JSON.parse(await read(".ai/.scaffy.json"));
    expect(manifest).toEqual({
      version: "0.0.0-test",
      preset: "java-spring-hexagonal",
      installedAt: "2026-01-01T00:00:00.000Z",
      symlinks: true,
    });
  });

  it("appends user-added files to an existing index", async () => {
    await install(opts());
    await fs.writeFile(
      path.join(dir, ".ai/context/domain.md"),
      "---\ndescription: Read for business terms.\n---\n# Domain\n",
    );
    await install(opts());
    const index = await read(".ai/context/INDEX.md");
    expect(index).toContain("- [domain.md](domain.md): Read for business terms.");
    expect(index.match(/\(architecture\.md\)/g)).toHaveLength(1);
  });

  it("links skills and prompts into .claude/ per file", async () => {
    await fs.mkdir(path.join(dir, ".claude/skills/mine"), { recursive: true });
    const report = await install(opts());

    expect(report.symlinks.failed).toEqual([]);
    expect(report.symlinks.created).toEqual(
      expect.arrayContaining([
        path.join(".claude", "skills", "update-context"),
        path.join(".claude", "commands", "onboard.md"),
      ]),
    );
    const link = path.join(dir, ".claude/skills/update-context");
    expect((await fs.lstat(link)).isSymbolicLink()).toBe(true);
    expect(await fs.readFile(path.join(link, "SKILL.md"), "utf8")).toContain("name: update-context");
    expect(await read(".claude/commands/onboard.md")).toContain("Brief me");
    expect((await fs.stat(path.join(dir, ".claude/skills/mine"))).isDirectory()).toBe(true);
  });

  it("creates no .claude/ links when symlinks are off", async () => {
    await install(opts({ symlinks: false }));
    await expect(fs.stat(path.join(dir, ".claude"))).rejects.toThrow();
  });
});

describe("listPresets", () => {
  it("lists real presets before none", async () => {
    const names = (await listPresets()).map((p) => p.name);
    expect(names).toEqual(["java-spring-hexagonal", "node-cli-typescript", "none"]);
  });
});

describe("upsertManagedSection", () => {
  it("replaces only the content between the markers", () => {
    const existing = "before\n<!-- scaffy:start -->\nold\n<!-- scaffy:end -->\nafter\n";
    const { content, result } = upsertManagedSection(existing, "new");
    expect(content).toBe("before\n<!-- scaffy:start -->\nnew\n<!-- scaffy:end -->\nafter\n");
    expect(result).toBe("updated");
  });

  it("reports unchanged when the section is current", () => {
    const existing = "<!-- scaffy:start -->\nsame\n<!-- scaffy:end -->\n";
    expect(upsertManagedSection(existing, "same").result).toBe("unchanged");
  });
});
