## AI scaffolding

**{{projectName}}**: {{summary}}

Read `.ai/INDEX.md` before starting a task. It indexes:

- `.ai/context/`: facts about this project (overview, architecture, conventions, tech stack). Read what bears on your task.
- `.ai/skills/`: procedures you follow on your own when a skill's description matches your task.
- `.ai/prompts/`: prompts a human invokes by name.

When you write documentation, follow the `write-documentation` skill. When you write code comments, follow `.ai/context/code-comments.md`.

Keep the scaffolding current:

- When you add, rename or remove a file under `.ai/`, update that folder's `INDEX.md` in the same change.
- When your change makes a context file inaccurate, update that file in the same change, or run the `update-context` skill.
