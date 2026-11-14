---
description: Read before adding modules, commands or dependencies. The entry/core split, the dependency rule, source layout, naming and the test strategy per layer.
---

# Architecture

scaffy is a command-line tool for Node.js (≥ 20), written in TypeScript as native ES modules and compiled with `tsc` from `src/` to `dist/`. The `bin` entry in `package.json` points at the compiled entry module. The code is split into a thin **entry layer** that owns the terminal and a **core** that does the work and knows nothing about the terminal.

## Layers

| Layer | Location | Contains | May depend on |
|---|---|---|---|
| Entry | `src/cli.ts` | Argument parsing, interactive prompts, help text, output formatting, exit codes, top-level error handling | Commands, Core, terminal libraries |
| Commands | `src/commands/<name>.ts` (only when the tool has subcommands) | One handler per subcommand: turns parsed options into a core call and its result into output | Core, terminal libraries |
| Core | `src/*.ts`, or `src/core/` once it outgrows a handful of files | The operations the tool performs, with typed inputs and typed results | Node built-ins (`node:*`), non-terminal libraries, other core modules |

A tool without subcommands has no `commands/` layer; `cli.ts` calls the core directly.

## The dependency rule

Dependencies point inward: entry → commands → core.

- **Only the entry and command layers touch the terminal.** `process.argv`, `process.exit`, `process.stdout`/`process.stderr`, `console.*` and prompt/spinner/colour libraries appear nowhere in core.
- **Core returns, it does not print.** A core operation returns a result or report object (what was created, skipped, failed) and throws `Error`s for failures. The entry layer decides how to render them.
- **Core is parameterised, not ambient.** Working directory, clock, environment values and options are passed in as arguments (`targetDir`, `now?: Date`), not read from `process.cwd()`, `new Date()` or `process.env` deep inside core. This keeps core deterministic under test.
- **Core does real I/O through Node APIs.** Filesystem and network access is fine in core; abstract it only when a test needs to replace it.
- **No cycles.** Modules never import each other in a cycle, directly or indirectly.
- **Commands are independent.** One command module never imports another; shared logic moves into core.

## Source layout

scaffy has no subcommands, so it has no `commands/` layer:

```
src/
  cli.ts                Entry: parseArgs, @clack/prompts, summary/confirm, render InstallReport, fail()
  install.ts            Core: install(InstallOptions) → InstallReport, listPresets(), render()
  managed-section.ts    Core helper: upsertManagedSection() for AGENTS.md / CLAUDE.md
  frontmatter.ts        Core helper: readDescription() for Index entries
test/
  install.test.ts       Core tests (install, listPresets, upsertManagedSection)
  cli.test.ts           End-to-end tests spawning dist/cli.js
  global-setup.ts       Vitest global setup: builds dist/ with tsc before the run
templates/              Runtime data, shipped via the package.json "files" list
  base/ai/              Base Layer
  presets/<name>/       preset.json + ai/ laid over the Base Layer
  sections/             Managed Section bodies for AGENTS.md and CLAUDE.md
dist/                   Build output, git-ignored
```

Imports between source files use the `.js` extension (`import { install } from "./install.js"`), as `NodeNext` module resolution requires. Data files shipped with the package are located relative to the module with `new URL("../templates", import.meta.url)`, never relative to `process.cwd()`.

## Naming

| Kind | Pattern | Example |
|---|---|---|
| Core operation | verb, exported function | `install`, `listPresets` |
| Its input | `<Operation>Options` interface | `InstallOptions` |
| Its result | `<Operation>Report` or `<Operation>Result` interface | `InstallReport` |
| Command module | `src/commands/<command-name>.ts` | `src/commands/init.ts` |
| Command handler | `run<Command>` | `runInit` |
| Files | kebab-case | `managed-section.ts` |
| Tests | `test/<module>.test.ts` | `test/install.test.ts` |

## Testing per layer

| Layer | Test style |
|---|---|
| Core helpers | Plain unit tests with inline inputs; no filesystem |
| Core operations | Integration tests against a real temporary directory (`fs.mkdtemp(os.tmpdir())`, removed in `afterEach`), with fixed values for clock and other injected inputs |
| Commands / entry | A few end-to-end tests that spawn the built binary (`node dist/cli.js …`) with `--yes` and flags, asserting on exit code, stdout, stderr and the files written |

Interactive prompts are not tested directly; every prompt has a flag (see `cli-conventions.md`), so the end-to-end tests drive the non-interactive path.

## Enforcing the rules

`dependency-cruiser` (dev dependency) checks the dependency rule; run it with `npm run lint:deps` and in CI. A `.dependency-cruiser.cjs` at the project root:

```js
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "core-not-to-entry",
      comment: "Core must not depend on the entry or command layers.",
      severity: "error",
      from: { path: "^src/", pathNot: "^src/(cli\\.ts|commands/)" },
      to: { path: "^src/(cli\\.ts|commands/)" },
    },
    {
      name: "core-not-to-terminal",
      comment: "Only the entry and command layers talk to the terminal.",
      severity: "error",
      from: { path: "^src/", pathNot: "^src/(cli\\.ts|commands/)" },
      to: { path: "node_modules/(@clack/prompts|prompts|inquirer|@inquirer/[^/]+|chalk|picocolors|ora|commander|yargs)/" },
    },
    {
      name: "commands-independent",
      severity: "error",
      from: { path: "^src/commands/([^/]+)" },
      to: { path: "^src/commands/", pathNot: "^src/commands/$1" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
  },
};
```

with `"lint:deps": "depcruise src"` in `package.json`. Extend the terminal-library list with whatever the entry layer uses.
