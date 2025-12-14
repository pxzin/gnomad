<!--
SYNC IMPACT REPORT
==================
Version change: N/A (initial) → 1.0.0
Modified principles: N/A (initial creation)
Added sections:
  - Core Principles (5 principles)
  - Development Workflow
  - Quality Gates
  - Governance
Removed sections: None
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ No updates required (constitution-agnostic)
  - .specify/templates/spec-template.md ✅ No updates required (constitution-agnostic)
  - .specify/templates/tasks-template.md ✅ No updates required (constitution-agnostic)
  - .specify/templates/checklist-template.md ✅ No updates required (constitution-agnostic)
  - .specify/templates/agent-file-template.md ✅ No updates required (constitution-agnostic)
Follow-up TODOs: None
-->

# Gnomes At Work Constitution

## Core Principles

### I. Type Safety First

All code MUST be written in TypeScript with strict mode enabled. Type inference is acceptable for local variables but explicit types are REQUIRED for:
- Function parameters and return types
- Public API surfaces (exported functions, classes, interfaces)
- Game entity definitions (dwarfs, terrain, buildings, resources)
- Event payloads and state transitions

Rationale: A colony sim has complex interdependent systems (AI, physics, rendering, economy). Compile-time type checking prevents runtime bugs that are difficult to reproduce in dynamic game states.

**Non-negotiables:**
- `strict: true` in tsconfig.json
- No `any` types without explicit justification in code comments
- No `@ts-ignore` without linked issue/ticket explaining temporary necessity
- Game state MUST be fully typed (no implicit any in entity collections)

### II. Entity-Component Architecture

Game objects MUST follow an Entity-Component pattern where:
- **Entities** are unique identifiers (numbers or strings)
- **Components** are pure data structures (no methods)
- **Systems** are functions that operate on entities with specific component sets

Rationale: Colony sims with hundreds of dwarfs, terrain tiles, and buildings require efficient iteration and cache-friendly memory layouts. ECS enables performant queries and clean separation of concerns.

**Non-negotiables:**
- Components MUST be plain TypeScript interfaces/types
- Systems MUST be stateless functions (take world state in, return updates out)
- No inheritance hierarchies for game objects (composition over inheritance)
- Entity lifecycle (creation, destruction) MUST be explicit and tracked

### III. Documentation as Specification

Every game system MUST be documented before implementation begins. Documentation serves as the specification and contract.

Required documentation:
- **System overview**: What problem does this system solve?
- **Data structures**: What components does this system use/produce?
- **Behavior rules**: Deterministic description of system logic
- **Integration points**: How does this system interact with others?

Rationale: Game systems are interconnected. Undocumented interactions lead to emergent bugs. Writing documentation first forces clear thinking about boundaries.

**Non-negotiables:**
- No system implementation without corresponding doc in `docs/systems/`
- API changes MUST update documentation in the same commit
- User-facing features MUST have entry in player-facing docs

### IV. Simplicity and YAGNI

Start with the simplest implementation that works. Add complexity only when demonstrated necessary by actual gameplay needs.

**Guidelines:**
- Prefer simple loops over complex algorithms until profiling shows bottlenecks
- No abstraction layers without three concrete use cases
- No configuration/settings for behavior that can be hardcoded
- No "engine" code—build the game, extract patterns as they emerge

Rationale: Game development is iterative. Features will be cut, mechanics will change. Premature abstraction creates maintenance burden for code that may never be used.

**Non-negotiables:**
- No factory patterns, dependency injection containers, or service locators without documented justification
- No generic "engine" modules—all code serves specific game functionality
- Optimize only after profiling identifies actual bottlenecks

### V. Deterministic Game State

All game state updates MUST be deterministic given the same inputs. This enables:
- Save/load functionality via state serialization
- Replay systems for debugging
- Future multiplayer synchronization

**Rules:**
- No direct `Math.random()` calls—use seeded PRNG passed through systems
- No `Date.now()` for game logic—use tick counter from game loop
- State mutations MUST be explicit (no hidden side effects in getters)
- External inputs (user actions, time) MUST be captured as discrete events

Rationale: Debugging emergent behavior in colony sims requires reproducibility. If we can replay the exact sequence of events, we can find the bug.

**Non-negotiables:**
- Game state MUST be serializable to JSON
- Random number generation MUST use provided seed
- All game logic MUST be tick-based, not wall-clock based

## Development Workflow

### Branch Strategy

- `main`: Stable, playable builds only
- `feature/*`: Individual features, merged via PR
- Commit messages: `type(scope): description` (conventional commits)

### Code Review Requirements

Every PR MUST verify:
1. TypeScript strict mode passes with no errors
2. New systems have documentation in `docs/systems/`
3. No `any` types added without justification
4. Game state changes are deterministic
5. Components are data-only (no methods)

## Quality Gates

### Pre-Commit

- TypeScript compilation succeeds
- Linter passes (ESLint with TypeScript rules)
- Formatter applied (Prettier)

### Pre-Merge

- All automated tests pass
- No decrease in type coverage
- Documentation updated for changed systems
- Manual playtest of affected features

## Governance

This constitution supersedes all other development practices for Gnomes At Work. Amendments require:

1. Written proposal documenting the change and rationale
2. Impact analysis on existing code
3. Migration plan if breaking existing patterns
4. Version increment following semantic versioning

**Compliance**: All PRs and code reviews MUST verify adherence to these principles. Violations require explicit justification and approval before merge.

**Runtime Guidance**: See `docs/development.md` for day-to-day development guidance, commands, and tooling.

**Version**: 1.0.0 | **Ratified**: 2025-12-11 | **Last Amended**: 2025-12-11
