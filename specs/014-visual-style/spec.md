# Feature Specification: Visual Style & Resolution

**Feature Branch**: `014-visual-style`
**Created**: 2025-12-21
**Status**: Draft
**Input**: User description: "Define final visual style including tile/sprite resolution and art direction"

## Clarifications

### Session 2025-12-21

- Q: What visual technique for background depth? → A: Dimming (darken background tiles by 30-50%)
- Q: What outline style for sprites? → A: Dark outline (1px black or dark brown around sprites)
- Q: What color palette approach? → A: Unrestricted (any colors allowed, rely on artist judgment)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Art Direction Decision (Priority: P1)

As a game developer, I need to finalize the visual style and resolution for the game so that all future art assets can be created consistently and the game has a cohesive aesthetic.

**Why this priority**: This is the foundational decision that impacts every visual asset in the game. Without this, art production cannot proceed efficiently.

**Independent Test**: Can be fully tested by creating sample assets in the chosen resolution and validating they look good in-game with foreground/background layer distinction.

**Acceptance Scenarios**:

1. **Given** the game currently uses 16x16 tiles, **When** I evaluate resolution options, **Then** I can compare prototypes of 16x16 vs 32x32 in the actual game context
2. **Given** multiple resolution options exist, **When** I make a final decision, **Then** the decision is documented with clear rationale
3. **Given** the chosen resolution, **When** I view gnomes and tiles in-game, **Then** characters are visually distinguishable and appealing

---

### User Story 2 - Background/Foreground Distinction (Priority: P1)

As a player, I need to clearly distinguish between foreground blocks (solid, interactive) and background blocks (decorative, non-blocking) so I can understand the game world and make strategic decisions.

**Why this priority**: Core gameplay depends on players understanding which blocks are solid vs passable. Poor visual distinction breaks gameplay.

**Independent Test**: Can be tested by placing foreground and background blocks side-by-side and verifying players can immediately identify which is which.

**Acceptance Scenarios**:

1. **Given** a scene with both foreground and background blocks, **When** I look at the screen, **Then** I can instantly tell which blocks are solid
2. **Given** background blocks exist, **When** I observe them, **Then** they appear visually "behind" foreground blocks (dimmer, desaturated, or smaller)
3. **Given** the chosen art style, **When** I view deep underground areas, **Then** cave backgrounds are visually distinct from solid rock

---

### User Story 3 - Gnome Readability (Priority: P2)

As a player, I need to see my gnomes clearly and understand their state (idle, working, climbing, incapacitated) from their visual appearance.

**Why this priority**: Player connection to gnomes is important but secondary to basic gameplay clarity.

**Independent Test**: Can be tested by having gnomes in various states and verifying visual state is recognizable at a glance.

**Acceptance Scenarios**:

1. **Given** a gnome in any state, **When** I look at it, **Then** I can identify its current state within 1 second
2. **Given** multiple gnomes on screen, **When** I scan the play area, **Then** each gnome is individually visible and not lost in the background
3. **Given** the chosen resolution, **When** gnomes are animated, **Then** their animations are smooth and readable

---

### User Story 4 - Style Guide Creation (Priority: P3)

As an artist creating assets for the game, I need a documented style guide so I can create consistent art that matches the established aesthetic.

**Why this priority**: Important for long-term consistency but not blocking initial art creation.

**Independent Test**: Can be tested by giving the style guide to someone unfamiliar with the project and verifying they can create matching assets.

**Acceptance Scenarios**:

1. **Given** the style guide exists, **When** I read it, **Then** I understand color palette, shading style, and outline conventions
2. **Given** the style guide, **When** I create a new tile type, **Then** it fits seamlessly with existing art
3. **Given** the chosen resolution, **When** I reference the guide, **Then** I know exact pixel dimensions for all asset types

---

### Edge Cases

- What happens when tiles are viewed at different zoom levels?
- How do background blocks look at different depths (surface vs deep cave)?
- How do we handle the horizon line transition between sky and cave backgrounds?
- What happens with overlapping sprites (gnome in front of background block)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Game MUST support a single, consistent tile resolution across all assets
- **FR-002**: Foreground blocks MUST be visually distinct from background blocks at a glance
- **FR-003**: Background blocks MUST appear "behind" foreground elements by applying dimming (darken by 30-50%)
- **FR-004**: Gnome sprites MUST be clearly visible against both foreground and background elements
- **FR-005**: Gnome states (Idle, Walking, Climbing, Mining, Falling, Incapacitated) MUST be visually distinguishable
- **FR-006**: The horizon line MUST visually separate sky (above) from underground (below)
- **FR-007**: A documented style guide MUST be created covering resolution, unrestricted color palette (artist discretion), shading (with 1px dark outline for all sprites), and asset dimensions
- **FR-008**: All existing placeholder assets MUST be updated to match the final chosen style
- **FR-009**: Resolution choice MUST be 32x32 pixels for tiles and proportionally scaled sprites (approximately 32x48 for gnomes), enabling detailed visuals similar to Craft the World aesthetic

### Key Entities

- **Tile**: Base visual unit of the game world, with 32x32 pixel resolution
- **Sprite**: Animated entity graphics (gnomes), with 32x48 pixel resolution (1.5x tile height)
- **Background Block**: Non-solid decorative tile with visual depth treatment
- **Foreground Block**: Solid, interactive tile at full brightness/saturation
- **Style Guide**: Reference document defining visual standards for all assets

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can correctly identify foreground vs background blocks with 95% accuracy in under 2 seconds
- **SC-002**: Players can identify gnome states (idle/working/climbing/etc.) with 90% accuracy at a glance
- **SC-003**: New artists can create matching assets after reading the style guide with minimal revision needed
- **SC-004**: Final resolution decision documented with pros/cons analysis and test results
- **SC-005**: Complete tileset available in chosen resolution covering all existing game elements
- **SC-006**: Gnome sprite sheet updated to chosen resolution with all state animations

## Assumptions

- The pixel art editor (feature 002) is available for creating prototype assets
- The background blocks system (feature 010) is already implemented and working
- Both 16x16 and 32x32 resolutions are technically feasible with the current rendering system
- The game targets desktop browsers as the primary platform (no mobile-specific constraints)
- Current 16x16 assets can serve as reference for style during prototyping

## Dependencies

- **010-background-blocks-horizon**: Must be complete to test foreground/background visual distinction
- **Pixel Art Editor (002)**: Useful for creating prototype assets in different resolutions

## Out of Scope

- Animation frame counts and timing (will be defined per-asset as needed)
- Sound design and audio style
- UI/HUD visual design (separate feature)
- Particle effects and VFX
- Localization of any text elements in art
