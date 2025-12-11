/**
 * HUD Command Contracts
 *
 * This file defines the command types and factory functions for HUD-related
 * game state mutations. These extend the existing command system.
 *
 * Location: src/lib/game/commands.ts (extend existing file)
 */

import type { Entity } from '../ecs/types';

// ============================================================================
// Command Types (extend existing CommandType enum)
// ============================================================================

export enum HudCommandType {
  /** Select one or more gnomes (replaces or extends current selection) */
  SELECT_GNOMES = 'SELECT_GNOMES',

  /** Clear all selections (tiles and gnomes) */
  CLEAR_SELECTION = 'CLEAR_SELECTION',

  /** Cancel dig tasks for selected tiles */
  CANCEL_DIG = 'CANCEL_DIG',
}

// ============================================================================
// Command Payloads
// ============================================================================

export interface SelectGnomesCommand {
  type: HudCommandType.SELECT_GNOMES;
  gnomeIds: Entity[];
  /** If true, adds to existing selection; if false, replaces */
  addToSelection: boolean;
}

export interface ClearSelectionCommand {
  type: HudCommandType.CLEAR_SELECTION;
}

export interface CancelDigCommand {
  type: HudCommandType.CANCEL_DIG;
  tiles: Array<{ x: number; y: number }>;
}

export type HudCommand =
  | SelectGnomesCommand
  | ClearSelectionCommand
  | CancelDigCommand;

// ============================================================================
// Command Factories
// ============================================================================

/**
 * Create a command to select gnomes.
 *
 * @param gnomeIds - Array of gnome entity IDs to select
 * @param addToSelection - If true, Shift+click behavior (toggle selection)
 *
 * @example
 * // Click on gnome (replaces selection)
 * emitCommand(selectGnomes([gnomeId], false));
 *
 * // Shift+click on gnome (add/remove from selection)
 * emitCommand(selectGnomes([gnomeId], true));
 */
export function selectGnomes(
  gnomeIds: Entity[],
  addToSelection: boolean = false
): SelectGnomesCommand {
  return {
    type: HudCommandType.SELECT_GNOMES,
    gnomeIds,
    addToSelection,
  };
}

/**
 * Create a command to clear all selections.
 *
 * @example
 * // Press Escape or click on empty space
 * emitCommand(clearSelection());
 */
export function clearSelection(): ClearSelectionCommand {
  return {
    type: HudCommandType.CLEAR_SELECTION,
  };
}

/**
 * Create a command to cancel dig tasks for tiles.
 *
 * @param tiles - Array of tile coordinates to cancel dig tasks for
 *
 * @example
 * // Cancel dig for selected tiles
 * emitCommand(cancelDig(state.selectedTiles));
 */
export function cancelDig(
  tiles: Array<{ x: number; y: number }>
): CancelDigCommand {
  return {
    type: HudCommandType.CANCEL_DIG,
    tiles,
  };
}
