---
description: Read before adding classes, packages or dependencies. Hexagonal layers, the dependency rule, package layout, naming and the test strategy per layer.
---

# Architecture

{{projectName}} is a Java Spring Boot application built with Maven as a single module, following the **hexagonal architecture** (ports and adapters). The business core is isolated from frameworks and infrastructure; everything outside it plugs in through ports.

## Layers

| Layer | Package | Contains | May depend on |
|---|---|---|---|
| Domain | `<base>.domain` | Entities, value objects, domain services, domain events, domain exceptions | Java standard library only |
| Application | `<base>.application` | Inbound ports (use cases), outbound ports, application services implementing the use cases | Domain |
| Adapters | `<base>.adapter.in.*`, `<base>.adapter.out.*` | Everything that talks to the outside world | Application, Domain, frameworks |
| Configuration | `<base>.config` | Spring `@Configuration` classes that wire the beans | Everything |

`<base>` is the root package of the application, e.g. `com.example.orders`.

## The dependency rule

Dependencies point inward: adapters → application → domain.

- **Domain is framework-free.** No Spring, JPA, Jackson or validation annotations in `domain`. Domain objects enforce their own invariants in constructors and methods.
- **Application is framework-free**, with one exception: `@Transactional` on application services, which marks the use-case transaction boundary.
- **Adapters are independent of each other.** An inbound adapter calls a use case; it never calls an outbound adapter directly.
- **Configuration wires everything.** Application services are plain classes, registered as beans with `@Bean` methods in `config`. Adapters may use stereotype annotations (`@RestController`, `@Component`) directly.

## Package layout

```
<base>/
  domain/
    model/                      Entities and value objects (Order, OrderId, Money)
    service/                    Domain services spanning several aggregates
    event/                      Domain events
    exception/                  Domain exceptions
  application/
    port/in/                    PlaceOrderUseCase, PlaceOrderCommand
    port/out/                   LoadOrderPort, SaveOrderPort
    service/                    PlaceOrderService implements PlaceOrderUseCase
  adapter/
    in/web/                     OrderController, request/response DTOs, web mappers
    in/messaging/               Message listeners
    out/persistence/            OrderJpaEntity, OrderJpaRepository, OrderPersistenceAdapter, mapper
    out/<system>/               Clients for external systems, e.g. out/payment/
  config/                       Bean wiring, security, properties
```

## Naming

| Kind | Pattern | Example |
|---|---|---|
| Inbound port | `<Action>UseCase` | `PlaceOrderUseCase` |
| Use-case input | `<Action>Command` (writes), `<Action>Query` (reads) | `PlaceOrderCommand` |
| Application service | `<Action>Service` | `PlaceOrderService` |
| Outbound port | `<Verb><Noun>Port` | `LoadOrderPort`, `SaveOrderPort` |
| Outbound adapter | `<Noun><Technology>Adapter` or `<Noun>PersistenceAdapter` | `OrderPersistenceAdapter`, `PaymentHttpAdapter` |
| JPA entity | `<Noun>JpaEntity` | `OrderJpaEntity` |
| Web controller | `<Noun>Controller` | `OrderController` |

## Data crossing boundaries

- Inbound adapters map their DTOs to a `Command`/`Query`; use cases return domain objects or dedicated result records; the adapter maps those back to response DTOs.
- Persistence adapters map between `*JpaEntity` and domain objects. JPA entities never leave the persistence adapter.
- Commands, queries and results are Java `record`s that validate their input in the compact constructor.

## Testing per layer

| Layer | Test style |
|---|---|
| Domain | Plain JUnit 5 unit tests, no Spring context, no mocks |
| Application | Unit tests of services with outbound ports stubbed (Mockito or hand-written fakes) |
| Web adapter | `@WebMvcTest` slice with the use case mocked |
| Persistence adapter | `@DataJpaTest` against a real database via Testcontainers |
| External clients | Tests against a stub server (e.g. WireMock) |
| Whole application | A few `@SpringBootTest` end-to-end tests on the critical paths |

## Enforcing the rules

An ArchUnit test (`com.tngtech.archunit:archunit-junit5`, test scope) runs with the unit tests and fails the build on a violation of the dependency rule:

```java
@AnalyzeClasses(packages = "<base>", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    @ArchTest
    static final ArchRule layers = layeredArchitecture().consideringOnlyDependenciesInLayers()
        .layer("Domain").definedBy("..domain..")
        .layer("Application").definedBy("..application..")
        .layer("Adapters").definedBy("..adapter..")
        .layer("Config").definedBy("..config..")
        .whereLayer("Adapters").mayOnlyBeAccessedByLayers("Config")
        .whereLayer("Application").mayOnlyBeAccessedByLayers("Adapters", "Config")
        .whereLayer("Domain").mayOnlyBeAccessedByLayers("Application", "Adapters", "Config");

    @ArchTest
    static final ArchRule domainIsFrameworkFree = noClasses().that().resideInAPackage("..domain..")
        .should().dependOnClassesThat().resideInAnyPackage(
            "org.springframework..", "jakarta.persistence..", "com.fasterxml.jackson..", "jakarta.validation..");

    @ArchTest
    static final ArchRule adaptersAreIndependent = slices().matching("..adapter.(*).(*)..")
        .should().notDependOnEachOther();
}
```
