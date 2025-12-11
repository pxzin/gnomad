/**
 * HUD Component Contracts
 *
 * This file defines the TypeScript interfaces for Svelte component props.
 * These serve as the contract between Game.svelte and HUD components.
 *
 * Location: src/lib/components/hud/types.ts (new file)
 */

import type { Entity } from '../ecs/types';
import type { GameLoop } from '../game/loop';
import type { GameState } from '../game/state';
import type { GnomeState } from '../components/gnome';
import type { TileType } from '../components/tile';

// ============================================================================
// HudOverlay Props
// ============================================================================

export interface HudOverlayProps {
  /** The game loop instance for state access and command emission */
  gameLoop: GameLoop;
}

// ============================================================================
// TopBar Props
// ============================================================================

export interface TopBarProps {
  /** Current game tick number */
  tick: number;

  /** Current game speed (0.5, 1, or 2) */
  speed: number;

  /** Whether the game is paused */
  isPaused: boolean;

  /** Number of gnomes in the game */
  gnomeCount: number;

  /** Task progress: { assigned: number, total: number } */
  taskProgress: TaskProgress;

  /** Callback to change game speed */
  onSpeedChange: (speed: number) => void;

  /** Callback to toggle pause */
  onPauseToggle: () => void;
}

export interface TaskProgress {
  /** Tasks currently assigned to gnomes */
  assigned: number;

  /** Total number of tasks */
  total: number;
}

// ============================================================================
// BottomBar Props
// ============================================================================

export interface BottomBarProps {
  /** Current selection information */
  selection: SelectionInfo;

  /** Current action button state */
  actionButton: ActionButtonState;

  /** Callback when action button is clicked */
  onActionClick: () => void;
}

// ============================================================================
// SelectionPanel Props
// ============================================================================

export interface SelectionPanelProps {
  /** Current selection information */
  selection: SelectionInfo;
}

export type SelectionInfo =
  | SelectionNone
  | SelectionSingleTile
  | SelectionSingleGnome
  | SelectionMultiple;

export interface SelectionNone {
  type: 'none';
}

export interface SelectionSingleTile {
  type: 'single-tile';
  tile: TileInfo;
}

export interface SelectionSingleGnome {
  type: 'single-gnome';
  gnome: GnomeInfo;
}

export interface SelectionMultiple {
  type: 'multiple';
  tileCount: number;
  gnomeCount: number;
}

export interface TileInfo {
  /** Grid X coordinate */
  x: number;

  /** Grid Y coordinate */
  y: number;

  /** Tile type (dirt or stone) */
  tileType: TileType;

  /** Current durability */
  durability: number;

  /** Maximum durability for this tile type */
  maxDurability: number;

  /** Whether this tile has an active dig task */
  hasDigTask: boolean;
}

export interface GnomeInfo {
  /** Gnome entity ID */
  entity: Entity;

  /** Current gnome state */
  state: GnomeState;

  /** Description of current task, or null if idle */
  currentTask: string | null;

  /** Current tile position */
  position: { x: number; y: number };
}

// ============================================================================
// ActionBar Props
// ============================================================================

export interface ActionBarProps {
  /** Current action button state */
  actionButton: ActionButtonState;

  /** Callback when action button is clicked */
  onActionClick: () => void;
}

export interface ActionButtonState {
  /** Button label with shortcut (e.g., "Dig (D)") */
  label: string;

  /** Keyboard shortcut key */
  shortcut: string;

  /** Whether the button is enabled */
  enabled: boolean;

  /** Action type for command dispatch */
  action: 'dig' | 'cancel-dig';
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Compute SelectionInfo from GameState.
 * This function should be implemented in a utility module.
 */
export function computeSelectionInfo(state: GameState): SelectionInfo {
  const { selectedTiles, selectedGnomes, tiles, tileGrid, gnomes, positions, tasks } = state;

  const tileCount = selectedTiles.length;
  const gnomeCount = selectedGnomes.length;

  // No selection
  if (tileCount === 0 && gnomeCount === 0) {
    return { type: 'none' };
  }

  // Multiple selection
  if (tileCount > 1 || gnomeCount > 1 || (tileCount > 0 && gnomeCount > 0)) {
    return { type: 'multiple', tileCount, gnomeCount };
  }

  // Single tile
  if (tileCount === 1 && gnomeCount === 0) {
    const coord = selectedTiles[0];
    const entityId = tileGrid[coord.y]?.[coord.x];
    const tile = entityId !== null ? tiles.get(entityId) : null;

    if (tile) {
      // Check for dig task at this tile
      let hasDigTask = false;
      for (const task of tasks.values()) {
        if (task.targetX === coord.x && task.targetY === coord.y) {
          hasDigTask = true;
          break;
        }
      }

      return {
        type: 'single-tile',
        tile: {
          x: coord.x,
          y: coord.y,
          tileType: tile.type,
          durability: tile.durability,
          maxDurability: getMaxDurability(tile.type),
          hasDigTask,
        },
      };
    }
  }

  // Single gnome
  if (gnomeCount === 1 && tileCount === 0) {
    const gnomeId = selectedGnomes[0];
    const gnome = gnomes.get(gnomeId);
    const position = positions.get(gnomeId);

    if (gnome && position) {
      let currentTask: string | null = null;
      if (gnome.currentTaskId !== null) {
        const task = tasks.get(gnome.currentTaskId);
        if (task) {
          currentTask = `Dig at (${task.targetX}, ${task.targetY})`;
        }
      }

      return {
        type: 'single-gnome',
        gnome: {
          entity: gnomeId,
          state: gnome.state,
          currentTask,
          position: { x: position.x, y: position.y },
        },
      };
    }
  }

  // Fallback
  return { type: 'none' };
}

/**
 * Get max durability for a tile type.
 * Should match values in tile creation.
 */
function getMaxDurability(tileType: TileType): number {
  switch (tileType) {
    case 'dirt':
      return 10;
    case 'stone':
      return 30;
    default:
      return 10;
  }
}

/**
 * Compute ActionButtonState from GameState.
 */
export function computeActionButtonState(state: GameState): ActionButtonState {
  const { selectedTiles, selectedGnomes, tasks, tileGrid } = state;

  // Mixed selection or gnomes only = disabled
  if (selectedGnomes.length > 0) {
    return {
      label: 'Dig (D)',
      shortcut: 'D',
      enabled: false,
      action: 'dig',
    };
  }

  // No tiles selected = disabled
  if (selectedTiles.length === 0) {
    return {
      label: 'Dig (D)',
      shortcut: 'D',
      enabled: false,
      action: 'dig',
    };
  }

  // Check if all selected tiles have dig tasks
  let allHaveDigTask = true;
  let anyWithoutDigTask = false;

  for (const coord of selectedTiles) {
    let hasTask = false;
    for (const task of tasks.values()) {
      if (task.targetX === coord.x && task.targetY === coord.y) {
        hasTask = true;
        break;
      }
    }
    if (!hasTask) {
      allHaveDigTask = false;
      anyWithoutDigTask = true;
    }
  }

  // All have dig task = Cancel Dig
  if (allHaveDigTask) {
    return {
      label: 'Cancel Dig (D)',
      shortcut: 'D',
      enabled: true,
      action: 'cancel-dig',
    };
  }

  // Some or none have dig task = Dig
  return {
    label: 'Dig (D)',
    shortcut: 'D',
    enabled: true,
    action: 'dig',
  };
}
