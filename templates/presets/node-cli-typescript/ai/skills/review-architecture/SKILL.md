---
name: review-architecture
description: Review a change against the entry/core architecture and the CLI conventions. Use after adding, moving or splitting modules under src/, after adding a command or flag, or when asked to review a change against the architecture.
---

# Review architecture

Checks a change against `.ai/context/architecture.md` and `.ai/context/cli-conventions.md`. Read both first; they are the authority.

## 1. Fix the scope

If the request names files, commits or a branch, review those. Otherwise review the uncommitted changes plus the commits on this branch that are not on the main branch.

Done when: you have the list of added and changed files under `src/` and `test/`, plus `package.json` if it changed.

## 2. Run the checks that exist

Run `npm run lint:deps` if the script exists, then `npm run typecheck` (or `npx tsc --noEmit`) and `npm test`. Record every failure.

Done when: each available check has passed or its failures are recorded.

## 3. Check each changed module

For every added or changed file under `src/`:

1. **Placement**: it sits in the layer its role belongs to (entry, command, core).
2. **Terminal access**: if it is core, it does not use `process.argv`, `process.exit`, `process.stdout`/`stderr`, `console.*`, or a prompt, spinner or colour library.
3. **Dependency rule**: its imports point inward only; no command imports another command; no cycles.
4. **Core shape**: core operations take an `<Operation>Options` object and return a typed result instead of printing; working directory, clock and environment are passed in.
5. **Naming**: files, operations, options, results and handlers follow the naming table.
6. **Tests**: each new core operation has an integration test against a temp directory; each new command or flag is covered by an end-to-end test.

Done when: every file has been checked against all six points.

## 4. Check the user-facing surface

If flags, prompts, output or errors changed, check them against `cli-conventions.md`: a flag for every prompt, `--yes` behaviour, help text updated, stdout/stderr split, exit codes, one-line errors, cancellation writes nothing. Check that the README documents new flags.

Done when: every user-facing change has been checked, or there were none.

## 5. Report

Report each finding as `path:line`, the rule it breaks, and the fix. End with a verdict: conforms, or the number of findings by rule. Do not fix findings unless asked.
