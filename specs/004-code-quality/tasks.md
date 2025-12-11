# Tasks: Technical Debt & Code Quality Review

**Input**: Design documents from `/specs/004-code-quality/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested - this is a refactoring task with existing tests (`pnpm check`).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/lib/` at repository root
- Config files: `src/lib/config/`
- Validation: `pnpm check` after each task

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create config directory structure for centralized constants

- [x] T001 Create config directory structure at `src/lib/config/` ✅
- [x] T002 [P] Create barrel file at `src/lib/config/index.ts` ✅

**Checkpoint**: Config directory ready for constant files

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: N/A - No foundational tasks needed for this refactoring

**⚠️ Note**: This refactoring doesn't require blocking prerequisites. User stories can proceed directly after setup.

**Checkpoint**: Setup complete - user story implementation can now begin

---

## Phase 3: User Story 1 - Centralizar Constantes e Magic Numbers (Priority: P1) 🎯 MVP

**Goal**: Todos os magic numbers centralizados em arquivos de configuração dedicados

**Independent Test**: `pnpm check` passa e jogo funciona identicamente. Constantes são importadas de `src/lib/config/` ao invés de definidas inline.

### Implementation for User Story 1

- [x] T003 [P] [US1] Create colors config file at `src/lib/config/colors.ts` with SELECTION_COLOR, SELECTION_ALPHA, TASK_MARKER_COLOR, TASK_MARKER_ALPHA, SKY_COLOR, GNOME_COLOR ✅
- [x] T004 [P] [US1] Create physics config file at `src/lib/config/physics.ts` with GRAVITY, TERMINAL_VELOCITY, GNOME_SPEED, GNOME_MINE_RATE ✅
- [x] T005 [P] [US1] Create timing config file at `src/lib/config/timing.ts` with TICKS_PER_SECOND, MS_PER_TICK, DOUBLE_CLICK_TIMEOUT ✅
- [x] T006 [P] [US1] Create input config file at `src/lib/config/input.ts` with PAN_SPEED ✅
- [x] T007 [US1] Update barrel file `src/lib/config/index.ts` to export all config modules ✅
- [x] T008 [US1] Update `src/lib/render/renderer.ts` to import colors from config (remove local SELECTION_COLOR, SELECTION_ALPHA, TASK_MARKER_COLOR, TASK_MARKER_ALPHA, use SKY_COLOR for backgroundColor) ✅
- [x] T009 [US1] Update `src/lib/systems/physics.ts` to import GRAVITY and TERMINAL_VELOCITY from config ✅
- [x] T010 [US1] Update `src/lib/components/gnome.ts` to re-export GNOME_COLOR from config/colors and GNOME_SPEED, GNOME_MINE_RATE from config/physics ✅
- [x] T011 [US1] Update `src/lib/input/handler.ts` to import DOUBLE_CLICK_TIMEOUT from config/timing and PAN_SPEED from config/input ✅
- [x] T012 [US1] Update `src/lib/game/loop.ts` to import TICKS_PER_SECOND, MS_PER_TICK from config/timing (keep re-exports for backwards compatibility) ✅
- [x] T013 [US1] Run `pnpm check` to verify no TypeScript errors after US1 changes ✅
- [ ] T014 [US1] Manual test: verify game runs correctly (rendering, physics, input all work) ⏳ (user action)

**Checkpoint**: All magic numbers centralized. `pnpm check` passes. Game runs identically.

---

## Phase 4: User Story 2 - Eliminar Duplicação de Código (Priority: P2)

**Goal**: Padrões de código repetidos extraídos para módulos reutilizáveis

**Independent Test**: Código duplicado identificado no research.md foi extraído. Funcionalidade permanece idêntica.

### Implementation for User Story 2

- [x] T015 [US2] Review research.md section 2.2 - confirm no significant duplications require extraction ✅
- [x] T016 [US2] Document decision in CLAUDE.md: "No abstractions created for ECS iteration patterns (YAGNI)" ✅

**Checkpoint**: Research finding confirmed: code is already DRY. No changes needed.

---

## Phase 5: User Story 3 - Padronizar Estrutura e Nomenclatura (Priority: P3)

**Goal**: Todos os arquivos seguem convenções consistentes

**Independent Test**: Arquivos de componentes e sistemas seguem mesma estrutura. Nomenclatura consistente verificável por inspeção.

### Implementation for User Story 3

- [x] T017 [US3] Audit component files in `src/lib/components/` - verify all follow Interface + Factory + Constants pattern ✅
- [x] T018 [US3] Audit system files in `src/lib/systems/` - verify all follow Main Function + Helpers + JSDoc pattern ✅
- [x] T019 [US3] Verify all exported constants use UPPER_SNAKE_CASE naming convention ✅
- [x] T020 [US3] Add conventions documentation to `specs/004-code-quality/contracts/conventions.md` (already created) ✅
- [x] T021 [US3] Run `pnpm lint` to verify code style consistency ⚠️ (ESLint config migration needed - project issue)

**Checkpoint**: Structure audit complete. Conventions documented.

---

## Phase 6: User Story 4 - Melhorar Type Safety (Priority: P4)

**Goal**: Código tem tipagem explícita, zero 'any' types

**Independent Test**: `pnpm check` passa em strict mode. Zero 'any' sem justificativa.

### Implementation for User Story 4

- [x] T022 [US4] Run `grep -rn ": any" src/lib --include="*.ts" | grep -v editor` to verify zero 'any' usage ✅ (zero matches)
- [x] T023 [US4] Audit public functions in `src/lib/game/` for explicit return types ✅
- [x] T024 [US4] Audit public functions in `src/lib/systems/` for explicit return types ✅
- [x] T025 [US4] Audit public functions in `src/lib/render/` for explicit return types ✅
- [x] T026 [US4] Run `pnpm check` in strict mode to verify type safety ✅ (0 errors)

**Checkpoint**: Type safety verified. All public functions have explicit types.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation updates and final validation

- [x] T027 [P] Update CLAUDE.md with new config structure documentation in `CLAUDE.md` ✅
- [x] T028 [P] Update CLAUDE.md Design Principles section with DRY pattern example (GameSpeed enum) ✅ (already done in previous session)
- [x] T029 Run `pnpm check` final validation ✅ (0 errors)
- [x] T030 Run `pnpm lint` final validation ⚠️ (ESLint config migration needed - project issue)
- [ ] T031 Manual playtest: verify game runs correctly with all changes ⏳ (user action)
- [x] T032 Run quickstart.md validation checklist ✅

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: N/A for this refactoring
- **User Stories (Phase 3-6)**: Depend on Setup completion
  - US1 (P1): Must complete first - creates config structure used by validation
  - US2-US4 (P2-P4): Can run in parallel after US1, or sequentially
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Setup - Creates config files
- **User Story 2 (P2)**: Can start after Setup - Independent analysis task
- **User Story 3 (P3)**: Can start after Setup - Independent audit task
- **User Story 4 (P4)**: Can start after Setup - Independent type check task

### Within Each User Story

- Config files created before imports updated
- Imports updated before validation
- Validation after all changes in story

### Parallel Opportunities

- T003, T004, T005, T006 can run in parallel (different config files)
- T027, T028 can run in parallel (different sections of CLAUDE.md)
- US2, US3, US4 can run in parallel after US1 completes

---

## Parallel Example: User Story 1

```bash
# Launch all config file creation tasks together:
Task: "Create colors config file at src/lib/config/colors.ts"
Task: "Create physics config file at src/lib/config/physics.ts"
Task: "Create timing config file at src/lib/config/timing.ts"
Task: "Create input config file at src/lib/config/input.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 3: User Story 1 (T003-T014)
3. **STOP and VALIDATE**: `pnpm check` and manual playtest
4. Most value delivered with minimal changes

### Incremental Delivery

1. Complete Setup → Config directory ready
2. Add User Story 1 → All constants centralized → Validate (MVP!)
3. Add User Story 2 → Confirm no duplications → Document
4. Add User Story 3 → Structure audit → Document conventions
5. Add User Story 4 → Type safety audit → Confirm strict mode
6. Polish → Update docs, final validation

### Single Developer Strategy

Recommended order for single developer:
1. Setup (2 tasks)
2. US1 complete (12 tasks) → Major value
3. US2 (2 tasks) → Quick confirmation
4. US3 (5 tasks) → Audit and document
5. US4 (5 tasks) → Type audit
6. Polish (6 tasks) → Final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Run `pnpm check` after each task group to catch issues early
- This is a refactoring - no behavior changes expected
- Commit after each user story completion for easy rollback
