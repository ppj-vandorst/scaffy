# scaffy

Adds AI-agent scaffolding to any project: an `AGENTS.md`, a `CLAUDE.md`, and a `.ai/` folder holding project context, prompts and skills. Index files make all of it discoverable by agents.

```sh
npx github:<user>/scaffy          # until published to npm
npx scaffy                        # once published
```

scaffy asks for the project name, what the project is about, a preset, and whether to link skills and prompts into `.claude/`. Each question has a flag (`scaffy --help`), so it also runs non-interactively:

```sh
npx scaffy --preset java-spring-hexagonal --description "Order management API." --yes
```

## What it writes

```
AGENTS.md                 managed section: summary, pointer to .ai/INDEX.md, upkeep rules
CLAUDE.md                 managed section: @AGENTS.md
.ai/
  INDEX.md
  .scaffy.json            what was installed (version, preset, date)
  context/                overview, architecture, conventions, tech-stack, code-comments, writing-style + INDEX.md
  prompts/                onboard, plan-change, handoff (+ preset prompts) + INDEX.md
  skills/                 update-context, create-pr, write-documentation (+ preset skills) + INDEX.md
.claude/skills/<name>       → ../../.ai/skills/<name>        (optional)
.claude/commands/<name>.md  → ../../.ai/prompts/<name>.md    (optional)
```

Re-running is safe. Files under `.ai/` are only created when missing. In `AGENTS.md` and `CLAUDE.md`, scaffy updates only the part between `<!-- scaffy:start -->` and `<!-- scaffy:end -->`. Indexes gain entries for new files, including ones you added yourself.

After installing, ask your agent to run the `update-context` skill to fill in the context from the codebase.

## Presets

| Preset | What it adds |
|---|---|
| `java-spring-hexagonal` | Hexagonal architecture for Spring Boot + Maven with ArchUnit rules, a `review-architecture` prompt and an `add-use-case` skill |
| `node-cli-typescript` | A thin entry layer over pure core modules for Node.js CLIs in TypeScript, enforced with dependency-cruiser. Also adds `cli-conventions` context and `review-architecture` and `add-command` skills |
| `none` | An empty architecture stub |

A preset is a folder in `templates/presets/<name>/` holding a `preset.json` (`{ "description": "..." }`) and an `ai/` tree that is laid over `templates/base/ai/`. It must provide `ai/context/architecture.md`. Every context file, prompt and skill needs a frontmatter `description`, which becomes its index entry.

Templates may use `{{projectName}}`, `{{description}}`, `{{summary}}` (the first sentence of the description) and `{{preset}}`.

## Development

```sh
npm install
npm test              # builds dist/, runs core and end-to-end tests
npm run lint:deps     # dependency rules (.dependency-cruiser.cjs)
npm run build && node dist/cli.js --dir /tmp/some-project
```

See `GLOSSARY.md` for the domain language and `docs/adr/` for design decisions.

