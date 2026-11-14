---
description: Read when adding dependencies, running builds or tests. Languages, frameworks, build tool and key commands.
---

# Tech stack

| Concern | Choice | Defined in |
|---|---|---|
| Runtime | Node.js ≥ 20 | `package.json` `engines` |
| Language | TypeScript, strict, native ES modules (`"type": "module"`, `NodeNext`) | `tsconfig.json` |
| Build | `tsc` from `src/` to `dist/`; `dist/` is git-ignored and built on `prepare` | `package.json`, `tsconfig.json` |
| Argument parsing | `node:util` `parseArgs` (strict) | `src/cli.ts` |
| Interactive prompts and output | `@clack/prompts` (the only runtime dependency) | `src/cli.ts` |
| Tests | Vitest | `test/`, `vitest.config.ts` |
| Dependency rules | dependency-cruiser | `.dependency-cruiser.cjs` |

The published package contains `dist/` and `templates/` (the `files` list in `package.json`). The `bin` entry `scaffy` points at `dist/cli.js`.

## Commands

| Command | What it does |
|---|---|
| `npm install` | Install dependencies; also builds via `prepare` |
| `npm run build` | Compile to `dist/` |
| `npm run typecheck` | Type-check without emitting |
| `npm test` | Build `dist/`, then run the Vitest suite once (core and end-to-end tests) |
| `npm run lint:deps` | Check the dependency rules in `.dependency-cruiser.cjs` |
| `npm run build && node dist/cli.js --dir <path>` | Try the CLI against another directory |

There is no CI configuration yet.
