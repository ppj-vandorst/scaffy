---
description: Read before changing anything a user of the CLI sees. Flags, prompts, help, output streams, exit codes, error messages and cancellation.
---

# CLI conventions

How {{projectName}} behaves towards the person or script running it. These rules live in the entry layer (`src/cli.ts`, `src/commands/`); see `architecture.md`.

## Flags and prompts

- **Every prompt has a flag.** Each value the CLI asks for interactively can also be passed as a flag, so the tool runs unattended in scripts and CI.
- **`--yes` / `-y` runs non-interactively.** It accepts defaults and skips confirmations. If a value has no sensible default, `--yes` without its flag is an error that names the missing flag, not a prompt.
- **Never prompt without a TTY.** When stdin is not a terminal, behave as with `--yes`.
- **Parse strictly.** Unknown flags and malformed values are errors. Validate flag values (e.g. a name from a fixed list) before doing any work and list the valid choices in the message.
- **Flag style.** Long flags are kebab-case (`--dry-run`). Booleans default to off; negate a default-on behaviour with `--no-<thing>`. Short aliases only for the most common flags.

## Help and version

- `--help` / `-h` prints usage, a one-line purpose, and every flag with its argument and default, then exits 0. Keep the help text in one place in the entry layer and update it in the same change as the flags.
- `--version` / `-v` prints the version from `package.json` and exits 0.
- Help and version print before any other work. Strict parsing may reject an unknown flag first; that is fine.

## Output

- **stdout is for results; stderr is for diagnostics.** Results go to stdout: data a script might pipe (lists, generated content, machine-readable output) and the report of what a run changed. Errors go to stderr. Prompts, progress and warnings go through the prompt library; stray debug or progress output never goes to stdout.
- **Output that a script reads is stable.** Plain lines or tab-separated fields; offer `--json` when output is structured.
- **Report what changed.** After a run that writes files, list what was created, updated and left alone, with paths relative to the target directory.
- **Colour and spinners only on a TTY**, and respect `NO_COLOR`.

## Errors and exit codes

| Exit code | Meaning |
|---|---|
| `0` | Success, including `--help`, `--version` and nothing-to-do runs |
| `1` | Failure: invalid input, a failed operation, or the user aborted a prompt (Ctrl+C) |

- **Expected errors are one line, without a stack trace**: `<tool>: <what went wrong>` on stderr, followed by exit 1. Say what the user can do about it when that is not obvious.
- **Unexpected errors are caught at the top level** of `cli.ts`, printed the same way, and exit 1. Never leave an unhandled promise rejection.
- Core throws `Error` with a user-readable message; the entry layer does the printing and exiting.

## Safety

- **Cancelling writes nothing.** Aborting a prompt (Ctrl+C) or declining the confirmation before the write step leaves the target untouched and says that nothing was written. Aborting exits 1; declining is a normal outcome and exits 0.
- **Do not overwrite user work by default.** Re-running a command is safe; existing files are left alone unless a flag (e.g. `--force`) says otherwise.
- **Paths are resolved against `--dir` (or the current directory), never against the package location.**
