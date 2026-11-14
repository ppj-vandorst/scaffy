import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readDescription } from "./frontmatter.js";
import { upsertManagedSection, type SectionResult } from "./managed-section.js";

export const TEMPLATES_DIR = fileURLToPath(new URL("../templates", import.meta.url));

const AI_DIR = ".ai";
const FOLDERS = ["context", "prompts", "skills"] as const;
type Folder = (typeof FOLDERS)[number];

const INDEX_HEADERS: Record<Folder, string> = {
  context:
    "# Context\n\nFacts about this project. Read the files relevant to your task before changing code.\n",
  prompts:
    "# Prompts\n\nReusable prompts a human invokes deliberately. Run one only when a human asks for it by name.\n",
  skills:
    "# Skills\n\nProcedures you can follow on your own. When a description matches your task, open its `SKILL.md` and follow it step by step.\n",
};

export interface InstallOptions {
  targetDir: string;
  projectName: string;
  description: string;
  preset: string;
  symlinks: boolean;
  version: string;
  now?: Date;
}

export interface InstallReport {
  created: string[];
  skipped: string[];
  indexes: { path: string; result: "created" | "updated" | "unchanged" }[];
  sections: { path: string; result: SectionResult }[];
  symlinks: { created: string[]; skipped: string[]; failed: { path: string; reason: string }[] };
  manifest: string;
}

export interface Preset {
  name: string;
  description: string;
}

export async function listPresets(): Promise<Preset[]> {
  const dir = path.join(TEMPLATES_DIR, "presets");
  const names = (await fs.readdir(dir, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  const presets = await Promise.all(
    names.map(async (name) => {
      const meta = JSON.parse(await fs.readFile(path.join(dir, name, "preset.json"), "utf8"));
      return { name, description: String(meta.description ?? "") };
    }),
  );
  // `none` last so real presets are offered first.
  return presets.sort((a, b) => Number(a.name === "none") - Number(b.name === "none") || a.name.localeCompare(b.name));
}

export async function install(opts: InstallOptions): Promise<InstallReport> {
  const presets = await listPresets();
  if (!presets.some((p) => p.name === opts.preset)) {
    throw new Error(
      `Unknown preset "${opts.preset}". Available: ${presets.map((p) => p.name).join(", ")}`,
    );
  }

  const target = path.resolve(opts.targetDir);
  const vars = {
    projectName: opts.projectName,
    description: opts.description.trim(),
    summary: firstSentence(opts.description),
    preset: opts.preset,
  };
  const report: InstallReport = {
    created: [],
    skipped: [],
    indexes: [],
    sections: [],
    symlinks: { created: [], skipped: [], failed: [] },
    manifest: path.join(AI_DIR, ".scaffy.json"),
  };

  const layers = [
    path.join(TEMPLATES_DIR, "base", "ai"),
    path.join(TEMPLATES_DIR, "presets", opts.preset, "ai"),
  ];
  const files = new Map<string, string>();
  for (const layer of layers) {
    for (const rel of await walk(layer)) files.set(rel, path.join(layer, rel));
  }
  for (const [rel, src] of [...files].sort(([a], [b]) => a.localeCompare(b))) {
    const relDest = path.join(AI_DIR, rel);
    const dest = path.join(target, relDest);
    if (await exists(dest)) {
      report.skipped.push(relDest);
      continue;
    }
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, render(await fs.readFile(src, "utf8"), vars));
    report.created.push(relDest);
  }

  // Indexes are rebuilt from disk so files the user added get entries too.
  for (const folder of FOLDERS) {
    report.indexes.push(await writeIndex(target, folder));
  }

  for (const file of ["AGENTS.md", "CLAUDE.md"]) {
    const body = render(
      await fs.readFile(path.join(TEMPLATES_DIR, "sections", file), "utf8"),
      vars,
    );
    const dest = path.join(target, file);
    const existing = (await exists(dest)) ? await fs.readFile(dest, "utf8") : undefined;
    const { content, result } = upsertManagedSection(existing, body);
    if (result !== "unchanged") await fs.writeFile(dest, content);
    report.sections.push({ path: file, result });
  }

  if (opts.symlinks) await createSymlinks(target, report);

  // The manifest lets a future upgrade know what was installed.
  const manifestPath = path.join(target, report.manifest);
  let installedAt = (opts.now ?? new Date()).toISOString();
  if (await exists(manifestPath)) {
    try {
      installedAt = JSON.parse(await fs.readFile(manifestPath, "utf8")).installedAt ?? installedAt;
    } catch {
      // Corrupt manifest: overwrite it.
    }
  }
  const manifest = { version: opts.version, preset: opts.preset, installedAt, symlinks: opts.symlinks };
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

  return report;
}

async function writeIndex(
  target: string,
  folder: Folder,
): Promise<InstallReport["indexes"][number]> {
  const dir = path.join(target, AI_DIR, folder);
  const relIndex = path.join(AI_DIR, folder, "INDEX.md");
  const indexPath = path.join(target, relIndex);
  const entries = await indexEntries(dir, folder);

  if (!(await exists(indexPath))) {
    const list = entries.map((e) => e.line).join("\n");
    const body = list || "_Nothing here yet._";
    await fs.writeFile(indexPath, `${INDEX_HEADERS[folder]}\n${body}\n`);
    return { path: relIndex, result: "created" };
  }

  const existing = await fs.readFile(indexPath, "utf8");
  const missing = entries.filter((e) => !existing.includes(`](${e.link})`));
  if (missing.length === 0) return { path: relIndex, result: "unchanged" };
  const base = existing.replace(/\n*_Nothing here yet\._\n*/, "\n\n").replace(/\s*$/, "\n");
  await fs.writeFile(indexPath, base + missing.map((e) => e.line).join("\n") + "\n");
  return { path: relIndex, result: "updated" };
}

async function indexEntries(dir: string, folder: Folder): Promise<{ link: string; line: string }[]> {
  if (!(await exists(dir))) return [];
  const dirents = (await fs.readdir(dir, { withFileTypes: true })).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const entries: { link: string; line: string }[] = [];
  for (const d of dirents) {
    let name: string;
    let link: string;
    if (folder === "skills") {
      if (!d.isDirectory() && !d.isSymbolicLink()) continue;
      link = `${d.name}/SKILL.md`;
      name = d.name;
    } else {
      if (!d.name.endsWith(".md") || d.name === "INDEX.md") continue;
      link = d.name;
      name = folder === "prompts" ? d.name.replace(/\.md$/, "") : d.name;
    }
    const file = path.join(dir, link);
    if (!(await exists(file))) continue;
    const description = readDescription(await fs.readFile(file, "utf8")) ?? "(no description)";
    entries.push({ link, line: `- [${name}](${link}): ${description}` });
  }
  return entries;
}

async function createSymlinks(target: string, report: InstallReport): Promise<void> {
  const aiDir = path.join(target, AI_DIR);
  const links: { from: string; to: string; type: "dir" | "file" }[] = [];

  const skillsDir = path.join(aiDir, "skills");
  if (await exists(skillsDir)) {
    for (const d of await fs.readdir(skillsDir, { withFileTypes: true })) {
      if (d.isDirectory() && (await exists(path.join(skillsDir, d.name, "SKILL.md")))) {
        links.push({
          from: path.join(".claude", "skills", d.name),
          to: path.join("..", "..", AI_DIR, "skills", d.name),
          type: "dir",
        });
      }
    }
  }
  const promptsDir = path.join(aiDir, "prompts");
  if (await exists(promptsDir)) {
    for (const name of await fs.readdir(promptsDir)) {
      if (!name.endsWith(".md") || name === "INDEX.md") continue;
      links.push({
        from: path.join(".claude", "commands", name),
        to: path.join("..", "..", AI_DIR, "prompts", name),
        type: "file",
      });
    }
  }

  for (const link of links.sort((a, b) => a.from.localeCompare(b.from))) {
    const abs = path.join(target, link.from);
    if (await lexists(abs)) {
      report.symlinks.skipped.push(link.from);
      continue;
    }
    try {
      await fs.mkdir(path.dirname(abs), { recursive: true });
      await fs.symlink(link.to, abs, link.type);
      report.symlinks.created.push(link.from);
    } catch (err) {
      report.symlinks.failed.push({ path: link.from, reason: (err as Error).message });
    }
  }
}

async function walk(root: string, rel = ""): Promise<string[]> {
  if (!(await exists(path.join(root, rel)))) return [];
  const out: string[] = [];
  for (const d of await fs.readdir(path.join(root, rel), { withFileTypes: true })) {
    const child = path.join(rel, d.name);
    if (d.isDirectory()) out.push(...(await walk(root, child)));
    else out.push(child);
  }
  return out;
}

export function render(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (m, key: string) => vars[key] ?? m);
}

function firstSentence(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  const match = /^.*?[.!?](\s|$)/.exec(trimmed);
  return (match ? match[0] : trimmed).trim();
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function lexists(p: string): Promise<boolean> {
  try {
    await fs.lstat(p);
    return true;
  } catch {
    return false;
  }
}
