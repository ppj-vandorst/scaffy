---
description: Review a change against the hexagonal architecture rules in architecture.md.
---

Review scope: $ARGUMENTS

If the scope above is empty, review the uncommitted changes plus the commits on this branch that are not on the main branch.

Read `.ai/context/architecture.md` and `.ai/context/conventions.md`. Then check every changed or added class against them:

1. **Placement**: the class sits in the package its kind belongs to.
2. **Dependency rule**: its imports respect the allowed direction; `domain` has no framework imports; `application` uses only `@Transactional` from Spring; adapters do not reference each other.
3. **Ports**: adapters reach the core only through a `*UseCase`; the core reaches the outside only through a `*Port`.
4. **Boundaries**: JPA entities stay inside the persistence adapter; web DTOs stay inside the web adapter; mapping happens in the adapter.
5. **Naming**: the class follows the naming table.
6. **Tests**: each new class has the test style its layer prescribes.

Report each finding as `path:line`, the rule it breaks, and the fix. End with a verdict: conforms, or the number of findings by rule.
