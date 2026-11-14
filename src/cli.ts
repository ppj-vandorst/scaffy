#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import * as p from "@clack/prompts";
import { install, listPresets, type InstallReport } from "./install.js";

const HELP = `Usage: scaffy [options]

Adds AI scaffolding (AGENTS.md, CLAUDE.md and a .ai/ folder) to the current project.
Existing files are never overwritten; re-running is safe.

Options:
  --dir <path>          Target project directory (default: current directory)
  --name <name>         Project name (default: directory name)
  --description <text>  What the project is about
  --preset <name>       Preset to apply (see --list-presets)
  --no-symlinks         Don't link skills/prompts into .claude/
  --yes, -y             Accept defaults and skip the confirmation
  --list-presets        Print available presets and exit
  --version, -v         Print version
  --help, -h            Show this help
`;

const pkg = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { version: string };

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      dir: { type: "string" },
      name: { type: "string" },
      description: { type: "string" },
      preset: { type: "string" },
      "no-symlinks": { type: "boolean" },
      yes: { type: "boolean", short: "y" },
      "list-presets": { type: "boolean" },
      version: { type: "boolean", short: "v" },
      help: { type: "boolean", short: "h" },
    },
    strict: true,
  });

  if (values.help) return void process.stdout.write(HELP);
  if (values.version) return void process.stdout.write(`${pkg.version}\n`);

  const presets = await listPresets();
  if (values["list-presets"]) {
    for (const preset of presets) process.stdout.write(`${preset.name}\t${preset.description}\n`);
    return;
  }

  const targetDir = path.resolve(values.dir ?? process.cwd());
  const yes = values.yes ?? false;

  if (values.preset && !presets.some((x) => x.name === values.preset)) {
    fail(`Unknown preset "${values.preset}". Available: ${presets.map((x) => x.name).join(", ")}`);
  }

  p.intro(`scaffy ${pkg.version}`);

  const projectName =
    values.name ??
    (yes
      ? path.basename(targetDir)
      : guard(
          await p.text({
            message: "Project name",
            initialValue: path.basename(targetDir),
            validate: (v) => (v.trim() ? undefined : "Required"),
          }),
        ));

  let description = values.description;
  if (description === undefined) {
    if (yes) fail("--description is required with --yes");
    description = guard(
      await p.text({
        message: "What is this project about?",
        placeholder: "A REST API that manages customer orders for the webshop.",
        validate: (v) => (v.trim() ? undefined : "Required"),
      }),
    );
  }

  const preset =
    values.preset ??
    (yes
      ? "none"
      : guard(
          await p.select({
            message: "Which preset?",
            options: presets.map((x) => ({ value: x.name, label: x.name, hint: x.description })),
          }),
        ));

  const symlinks = values["no-symlinks"]
    ? false
    : yes
      ? true
      : guard(
          await p.confirm({
            message: "Link skills and prompts into .claude/ so Claude Code finds them natively?",
            initialValue: true,
          }),
        );

  if (!yes) {
    p.note(
      [
        `Directory:   ${targetDir}`,
        `Name:        ${projectName}`,
        `Description: ${description}`,
        `Preset:      ${preset}`,
        `Symlinks:    ${symlinks ? "yes" : "no"}`,
      ].join("\n"),
      "Summary",
    );
    if (!guard(await p.confirm({ message: "Write scaffolding?", initialValue: true }))) {
      p.cancel("Nothing written.");
      return;
    }
  }

  const report = await install({
    targetDir,
    projectName,
    description,
    preset,
    symlinks,
    version: pkg.version,
  });
  printReport(report);
  p.outro("Done. Ask your agent to run the update-context skill to fill in the context.");
}

function printReport(r: InstallReport): void {
  const lines: string[] = [];
  for (const f of r.created) lines.push(`+ ${f}`);
  for (const f of r.skipped) lines.push(`= ${f} (exists, left alone)`);
  for (const i of r.indexes) if (i.result !== "unchanged") lines.push(`~ ${i.path} (${i.result})`);
  for (const s of r.sections) lines.push(`~ ${s.path} (managed section ${s.result})`);
  for (const l of r.symlinks.created) lines.push(`→ ${l}`);
  for (const l of r.symlinks.skipped) lines.push(`= ${l} (exists, left alone)`);
  lines.push(`~ ${r.manifest}`);
  p.note(lines.join("\n"), "Changes");
  for (const f of r.symlinks.failed) p.log.warn(`Could not link ${f.path}: ${f.reason}`);
}

function guard<T>(value: T | symbol): T {
  if (p.isCancel(value)) {
    p.cancel("Cancelled. Nothing written.");
    process.exit(1);
  }
  return value as T;
}

function fail(message: string): never {
  process.stderr.write(`scaffy: ${message}\n`);
  process.exit(1);
}

main().catch((err: unknown) => {
  fail(err instanceof Error ? err.message : String(err));
});
