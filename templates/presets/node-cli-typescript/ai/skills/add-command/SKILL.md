---
name: add-command
description: Add a command, subcommand or flag to the Node CLI end to end, from core operation through entry-layer wiring and help text to tests and README. Use when implementing a new CLI feature, option or subcommand.
---

# Add a command

Builds a CLI feature from the inside out: core first, so it can be tested without the terminal, then the entry layer. `.ai/context/architecture.md` is the authority for layout, naming and test styles, and `.ai/context/cli-conventions.md` for flags, output and errors; read both first.

## 1. Define the feature

State:

- the command or flag as the user types it, with every option, its type and default;
- which values are prompted for interactively, and that each has a flag;
- what it does, what it writes or prints, and to which stream;
- how it fails, and the message for each expected failure.

Decide whether it is a new core operation or an extension of an existing one (a new option on `<Operation>Options`).

If any of these is unclear from the request, ask before writing code.

Done when: you can state usage, options, effects, output and failures in one short list.

## 2. Core

1. Add or extend the `<Operation>Options` and `<Operation>Report`/`Result` types.
2. Implement the operation in a core module. It takes everything it needs as arguments, returns a result, and throws `Error` with a user-readable message on failure. No terminal access.
3. Write integration tests against a temporary directory: the happy path, re-running (idempotence), and each expected failure.

Done when: the core tests pass and `npm run lint:deps` (if present) reports no violations.

## 3. Entry layer

1. Add the flag(s) to the argument parser in `src/cli.ts`, with strict validation before any work starts.
2. Add the interactive prompt, if any, skipped when the flag is given or `--yes` is set.
3. For a subcommand, add `src/commands/<name>.ts` with a `run<Command>` handler and dispatch to it from `cli.ts`.
4. Render the result: changes listed on success, `<tool>: <message>` on stderr and exit 1 on failure.
5. Update the help text in the same change.

Done when: `npm run build` succeeds and `node dist/cli.js --help` shows the new usage.

## 4. End-to-end test

Add a test that runs the built binary non-interactively with the new flag(s) and asserts exit code, stdout/stderr and the files written. Add one for the main failure path.

Done when: the end-to-end tests pass.

## 5. Document and verify

Document the command or flag in the README where usage is described. Run `npm run typecheck`, `npm test` and `npm run lint:deps` (if present). If the change made any `.ai/context/` file inaccurate, update it.

Done when: all checks pass and the README matches `--help`.
