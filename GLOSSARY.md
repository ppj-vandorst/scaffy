# Scaffy

Scaffy is a CLI that installs AI-agent guidance (instructions, project context, prompts and skills) into an existing codebase so agents can discover it on their own.

## Language

### Where scaffy works

**Target Project**:
The codebase that scaffy is run inside and writes its Scaffolding into.
_Avoid_: Host project, consumer, client project

**Scaffolding**:
The full set of agent-facing files scaffy installs in a Target Project: `AGENTS.md`, `CLAUDE.md` and the `.ai/` tree.
_Avoid_: Boilerplate, template output

**Managed Section**:
The part of a pre-existing file (such as `AGENTS.md`) that scaffy owns, delimited by scaffy markers; content outside it belongs to the user.
_Avoid_: Block, region

### What the Scaffolding contains

**Context**:
Durable, factual documentation about the Target Project (overview, architecture, conventions) that an agent reads before working.
_Avoid_: Docs, knowledge base

**Prompt**:
Reusable instruction text that a human deliberately invokes; an agent never picks one up on its own.
_Avoid_: Command, template

**Skill**:
A named procedure, with a description of when to use it, that an agent can select and follow autonomously.
_Avoid_: Tool, recipe, workflow

**Index**:
A markdown file listing the entries of one Scaffolding folder, each with a one-line "read this when…" description, so agents can navigate without opening everything.
_Avoid_: README, table of contents

### How the Scaffolding is composed

**Preset**:
A named bundle of Scaffolding files encoding default architectural decisions for a kind of project (e.g. `java-spring-hexagonal`); it must supply the architecture Context and may add any other Context, Prompts or Skills.
_Avoid_: Template, profile, stack

**Base Layer**:
The Scaffolding every Target Project receives regardless of Preset; a Preset is laid over it.
_Avoid_: Core, default preset
