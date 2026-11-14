---
name: write-documentation
description: Write or edit documentation for humans, such as a README, files under docs/, an ADR, a changelog or a .ai/ context file. Use whenever you write documentation.
---

# Write documentation

Documentation tells a reader what they need to use or change the project, in as few words as that takes. Code comments follow `.ai/context/code-comments.md` instead, and PR descriptions follow the `create-pr` skill.

## 1. Read the rules

Read `.ai/context/writing-style.md`. Every sentence you write follows it.

Done when: you have read the writing style.

## 2. Pin down reader and purpose

State in one sentence who reads this document and what they should be able to do afterwards. Check whether an existing document already covers the topic; extend that document instead of starting a new one.

Done when: you can name the reader, their goal, and the file you will write.

## 3. Draft

- Lead with what the reader needs most: what it is, how to use it, then the details.
- Write what the reader cannot cheaply look up. For versions and commands, name the file that defines them instead of copying values that will drift.
- Prefer a short sentence to a bullet, and a list to a long sentence of items.
- Use the project's terms from `GLOSSARY.md`, if it exists, and avoid the synonyms it lists.
- Show a command or example instead of describing it.

Done when: the draft covers the purpose from step 2 and nothing else.

## 4. Cut and check

Reread the draft against `.ai/context/writing-style.md`:

- delete needless words, sentences and sections;
- rewrite passive and negative constructions;
- replace vague words with concrete ones;
- remove every pattern from "Patterns to avoid";
- check every command, path and name against the code.

Done when: no sentence can lose a word without losing meaning, and every fact is checked.

## 5. Keep indexes current

If you added, renamed or removed a file under `.ai/`, update that folder's `INDEX.md`.

Done when: every index you touched matches its folder.
