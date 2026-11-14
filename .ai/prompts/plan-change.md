---
description: Plan a change against the project's context before any code is written.
---

The change: $ARGUMENTS

If the change above is empty, ask me what I want to change and wait.

1. Read `.ai/INDEX.md`, then every context file that bears on this change, `architecture.md` always included.
2. Find the code the change touches.
3. Propose a plan: the files to add or modify, in order, and the tests that prove each step. Name each place where the plan follows a rule from `architecture.md` or `conventions.md`.
4. List every point where the change would break a rule in the context, with the option of changing the code or amending the rule.

Stop after the plan. Write code only once I approve it.
