---
name: add-use-case
description: Add a use case end to end in the hexagonal Spring application, from inbound port through service and outbound ports to adapters, with tests per layer. Use when implementing a new feature, endpoint, or business operation.
---

# Add a use case

Builds one use case from the inside out, so each layer compiles against the one beneath it. `.ai/context/architecture.md` is the authority for packages, naming and test styles; read it first.

## 1. Define the use case

Name it `<Action>` (e.g. `PlaceOrder`). Decide whether it writes (`Command`) or reads (`Query`), its input fields, and what it returns. Find the domain objects it works on and the outbound operations it needs (load, save, call an external system).

If any of these is unclear from the request, ask before writing code.

Done when: you can state the action, input, output, domain objects and outbound ports in one short list.

## 2. Domain

Add or extend the entities and value objects the use case needs, in `domain`. Put invariants inside them. Write plain JUnit tests for each new rule.

Done when: the domain tests pass with no Spring context.

## 3. Application

1. In `application/port/in`: the `<Action>UseCase` interface and its `<Action>Command`/`<Action>Query` record, validating input in the compact constructor.
2. In `application/port/out`: one `*Port` interface per outbound operation, reusing existing ports where they fit.
3. In `application/service`: `<Action>Service` implementing the use case, `@Transactional` if it writes.
4. Unit-test the service with the outbound ports stubbed.

Done when: the service tests pass and `application` imports nothing from `adapter` or Spring except `@Transactional`.

## 4. Outbound adapters

For each new port, implement it in the matching `adapter/out/<system>` adapter (add a method to an existing adapter when one already serves that system). Map between infrastructure types and domain objects inside the adapter. Test it against real infrastructure as the testing table prescribes.

Done when: every new port has an implementation with a passing test.

## 5. Inbound adapter

Expose the use case where the request asks for it, e.g. an endpoint in `adapter/in/web`, with request/response DTOs and mapping in the adapter. Add a `@WebMvcTest` slice test with the use case mocked.

Done when: the slice test passes.

## 6. Wire and verify

Register `<Action>Service` as a bean in `config`. Run `mvn verify`.

Done when: the full build passes, including `ArchitectureTest`.
