---
name: update-context
description: Refresh the project context in .ai/context/ from the codebase and repair the .ai/ indexes. Use when context files are empty or stale, after structural changes, or when asked to update the project context.
---

# Update context

The files in `.ai/context/` describe the codebase as it is. This skill rewrites them from the code, without silently erasing a decision someone wrote down.

## 1. Snapshot the current context

Read `.ai/INDEX.md` and every file in `.ai/context/`. Note each concrete statement they make (a layer, a dependency rule, a naming convention, a command). These are the statements a rewrite may contradict.

Done when: you hold a list of statements for every context file.

## 2. Survey the codebase

Gather evidence from the code itself:

- build and dependency files, and the commands they define;
- the directory and package layout, and which parts depend on which;
- entry points, configuration, and how external systems are reached;
- a representative sample of source and test files from every top-level module, for naming, style, error handling and test habits;
- CI configuration.

Done when: every top-level module is accounted for and each claim you will write has a file you can cite.

## 3. Draft the new context

For each context file, draft a version that describes the code as it is now. Keep the frontmatter `description`; adjust it only if the file's purpose changed.

- Write what a reader cannot cheaply look up: structure, dependency rules, conventions, the reason behind a choice. For commands and versions, name the file that defines them.
- Replace placeholder text ("Not filled in yet") with real content.
- Add a new context file when a topic is substantial and fits none of the existing ones; give it a `description` saying when to read it.

## 4. Resolve conflicts with the snapshot

Compare each draft with the statements from step 1. A **conflict** is a draft that contradicts or drops an existing statement. Statements in `architecture.md` usually record a deliberate decision, so treat them with extra care.

Present every conflict to the user at once, each as:

- the existing statement and its file;
- the evidence from the code (`path:line`);
- the choice: **keep the statement** (the code has drifted; list the drift as a follow-up) or **amend the context** to match the code.

Write the files only after the user has decided every conflict. Statements with no conflict can be written straight away.

Done when: every context file is written and every conflict has a recorded decision.

## 5. Repair the indexes

For each of `.ai/context/`, `.ai/prompts/` and `.ai/skills/`, make its `INDEX.md` list every entry on disk exactly once, as `- [name](relative-link): description`, with the description taken from the entry's frontmatter. Remove entries whose file no longer exists.

Done when: every index matches its folder on disk.

## 6. Report

Summarise for the user: which files changed, the conflicts and how each was decided, and any drift kept as a follow-up.
