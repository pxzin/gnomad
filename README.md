# Gnomes At Work

A browser-based 2D side-scrolling colony management sandbox game where players command a tribe of gnomes to dig through procedurally generated terrain, build underground bases, gather resources, and survive.

Inspired by **Terraria** and **Craft the World**.

## Tech Stack

- **Framework**: SvelteKit 2.x + Svelte 5
- **Rendering**: PixiJS 8 (WebGPU/WebGL)
- **Language**: TypeScript 5.x (strict mode)
- **Architecture**: Entity-Component-System (ECS)
- **Build Tool**: Vite 7

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
pnpm build
pnpm preview
```

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm check` | Type-check the project |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:e2e` | Run E2E tests (Playwright) |

## Project Structure

```
src/lib/
  config/        # Centralized constants (colors, physics, timing, input)
  components/    # ECS components (Position, Velocity, Gnome, Tile, etc.)
  systems/       # ECS systems (physics, mining, pathfinding, task-assignment)
  game/          # Game loop and state management
  render/        # PixiJS rendering
  input/         # Input handling
  ecs/           # Entity-component-system utilities
  world-gen/     # World generation

static/assets/   # Game assets (tiles, sprites, UI)

specs/           # Feature specifications and design documents
  ###-feature/   # Each feature has its own spec folder
    spec.md      # User stories and requirements
    plan.md      # Implementation plan
    tasks.md     # Task breakdown
```

## Features

### Implemented

- Procedural world generation with layered terrain (grass, dirt, stone, ore)
- Side-scrolling camera with pan controls
- Gnome entities with physics and pathfinding
- Mining system with task assignment
- Resource collection and stockpile
- Background blocks with visual depth (dimming)
- Horizon system (sky above, cave below)
- Climbing mechanics for vertical navigation
- Organic idle behavior for gnomes
- Task priority system
- Game HUD
- Performance optimizations (binary heaps, dirty rendering)

### Planned

- Building/construction system
- Crafting system
- Combat and threats
- Save/load functionality
- Visual style upgrade (32x32 tiles)

## Architecture

The game uses an **Entity-Component-System (ECS)** architecture:

- **Entities**: Unique IDs representing game objects (gnomes, tiles, items)
- **Components**: Data containers attached to entities (Position, Velocity, Gnome, Tile)
- **Systems**: Logic that processes entities with specific component combinations

### Key Systems

| System | Purpose |
|--------|---------|
| `physicsSystem` | Gravity, collision, movement |
| `pathfindingSystem` | A* pathfinding for gnome navigation |
| `taskAssignmentSystem` | Assigns idle gnomes to pending tasks |
| `miningSystem` | Handles block destruction and resource drops |
| `climbingSystem` | Vertical movement on climbable surfaces |

## Development Guidelines

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines including:

- Code style and conventions
- Design principles (DRY, YAGNI, centralized config)
- Performance optimization patterns
- ECS patterns and best practices

## License

Private project - All rights reserved.
