/**
 * Resource Collection System
 *
 * Previously handled automatic resource collection when gnomes walked over resources.
 * Now disabled - resources are collected via Collect tasks through collect-task.ts.
 *
 * This system is kept as a no-op placeholder for potential future proximity-based
 * collection mechanics or special collection behaviors.
 */

import type { GameState } from '$lib/game/state';

/**
 * Resource collection system update.
 * Currently a no-op - collection is handled by collect-task.ts via Collect tasks.
 */
export function resourceCollectionSystem(state: GameState): GameState {
	// Collection is now handled by the collectTaskSystem
	// Resources must be explicitly collected via Collect tasks
	return state;
}
