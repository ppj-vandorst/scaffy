---
description: Read before writing code. Naming, code style, error handling and testing habits this codebase follows.
---

# Conventions

## Code style

- **Formatting:** two-space indent, double quotes, semicolons, trailing commas in multi-line literals, lines of roughly 100 characters. No formatter or linter is configured, so match the surrounding code.
- **Modules:** named exports only. Relative imports carry the `.js` extension (`./install.js`). Node built-ins use the `node:` prefix (`node:fs`, `node:path`).
- **Filesystem:** `promises as fs` from `node:fs`. Use small local helpers (`exists`, `lexists`, `walk`) instead of extra dependencies.
- **Types:** exported `interface`s for options and reports (`InstallOptions`, `InstallReport`). Derive string unions from `as const` arrays (`Folder`). Use `type` imports for type-only imports.
- **Comments:** short and about *why*. In `install()`, numbered step comments (`// 1. …`) mark the phases. A one-line JSDoc goes on exported helpers whose contract is not obvious from the name.
- **Determinism:** sort everything the install writes or reports (files, index entries, symlinks) so output is stable across machines.

## Domain language

Use the `GLOSSARY.md` terms in code, comments, tests and docs (Preset, Base Layer, Managed Section, Index …) and avoid the synonyms it lists.

## Templates

- Every context file, prompt and skill under `templates/` needs a single-line frontmatter `description`. It becomes the Index entry (`src/frontmatter.ts` reads only single-line values). Write it as "Read when…" / "Use when…".
- Skills are `skills/<name>/SKILL.md` with `name` and `description` frontmatter. They're written as numbered steps, each ending in a **Done when:** line.
- A preset must provide `ai/context/architecture.md` and a `preset.json` with a `description`.

## Error handling

- Core functions throw `Error` with a user-readable message (`Unknown preset "x". Available: …`).
- `src/cli.ts` validates flags up front and calls `fail()`, which prints `scaffy: <message>` to stderr and exits 1. The top-level `main().catch` routes unexpected errors through the same path.
- A corrupt or missing optional file (such as the manifest) is recovered from silently, not reported.

## Testing

- Vitest, in `test/<module>.test.ts`, importing from `../src/*.js`.
- Core behaviour is tested through `install()` against a fresh `fs.mkdtemp` directory per test, removed in `afterEach`. Pure helpers (`upsertManagedSection`) get direct unit tests.
- A shared `opts(over)` factory supplies `InstallOptions` with a fixed `now`, so manifests are deterministic.
- End-to-end tests in `test/cli.test.ts` spawn `node dist/cli.js` with flags and `--yes`, asserting exit code, stdout, stderr and files written. `test/global-setup.ts` (wired in `vitest.config.ts`) builds `dist/` before the run, so `npm test` always tests the current source.
- Every new preset gets a test that installs it and checks its distinctive files and Index entries. The `listPresets` test pins the full ordered preset list.
