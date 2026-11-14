---
description: Read before writing or editing code comments. When a comment is warranted and what it may say.
---

# Code comments

Write as few comments as possible. The code says *what* it does; names, types and structure carry that.

A comment explains *why* the code does something the code itself cannot make clear: a workaround for a bug elsewhere, a constraint from outside the codebase, a non-obvious trade-off, an ordering that matters.

**Never write a comment that explains what the code does.** That includes:

- restating a line or block in prose (`// increment the counter`);
- step markers that narrate a function (`// 1. Load the config`);
- section banners and labels that repeat a function or variable name.

If code needs a "what" comment to be understood, rename or extract instead. Delete "what" comments you come across in code you are changing.

Doc comments on a public API are fine when they state a contract the signature cannot: units, side effects, error conditions.
