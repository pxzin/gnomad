/**
 * Climbing System
 *
 * Manages gnome climbing state, surface detection, and fall mechanics.
 */

import type { GameState } from '$lib/game/state';
import type { Entity } from '$lib/ecs/types';
import { ClimbableSurfaceType } from '$lib/components/climbing';
import { GnomeState } from '$lib/components/gnome';
import { isSolid, getPermanentBackgroundType } from '$lib/world-gen/generator';
import { getBackgroundTileAt } from '$lib/ecs/background';
import { PermanentBackgroundType } from '$lib/components/background';
import { getEntitiesWithGnome, updateGnome } from '$lib/ecs/world';
import { BASE_FALL_CHANCE, SURFACE_MODIFIERS } from '$lib/config/climbing';

/**
 * Seeded PRNG using mulberry32 algorithm.
 * Provides deterministic random numbers based on seed.
 */
function mulberry32(seed: number): () => number {
	return function () {
		let t = (seed += 0x6d2b79f5);
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * Create a seeded random function for fall chance check.
 * Uses game seed, entity ID, and tick to ensure determinism.
 */
function createFallRandom(gameSeed: number, entity: Entity, tick: number): () => number {
	const combinedSeed = gameSeed ^ (entity * 37) ^ (tick * 19);
	return mulberry32(combinedSeed);
}

/**
 * Determine if a climbing gnome should fall this tick.
 * Uses deterministic seeded PRNG for reproducible behavior.
 * Fall chance is modified by the current climbing surface type.
 *
 * @param state - Current game state
 * @param entity - The gnome entity
 * @returns true if the gnome should fall
 */
function shouldFall(state: GameState, entity: Entity): boolean {
	const position = state.positions.get(entity);
	if (!position) return false;

	// Get surface-specific fall chance modifier
	const surface = getClimbableSurface(state, position.x, position.y);
	const fallChanceModifier = SURFACE_MODIFIERS[surface].fallChanceMultiplier;
	const adjustedFallChance = BASE_FALL_CHANCE * fallChanceModifier;

	const random = createFallRandom(state.seed, entity, state.tick);
	return random() < adjustedFallChance;
}

/**
 * Detect what type of climbable surface exists at a position.
 * Priority order: BlockEdge > BackgroundBlock > CaveBackground > None
 *
 * @param state - Current game state
 * @param x - World X coordinate
 * @param y - World Y coordinate
 * @returns The type of climbable surface at this position
 */
export function getClimbableSurface(state: GameState, x: number, y: number): ClimbableSurfaceType {
	const tileX = Math.floor(x);
	const tileY = Math.floor(y);

	// Check adjacent foreground blocks (block edge) - highest priority
	if (isSolid(state, tileX - 1, tileY) || isSolid(state, tileX + 1, tileY)) {
		return ClimbableSurfaceType.BlockEdge;
	}

	// Check background tile at position
	const bgEntity = getBackgroundTileAt(state, tileX, tileY);
	if (bgEntity !== null) {
		return ClimbableSurfaceType.BackgroundBlock;
	}

	// Check permanent background (cave vs sky)
	if (getPermanentBackgroundType(state, tileY) === PermanentBackgroundType.Cave) {
		return ClimbableSurfaceType.CaveBackground;
	}

	// Sky or no surface - not climbable
	return ClimbableSurfaceType.None;
}

/**
 * Check if a gnome is currently making a climbing move (vertical movement in path).
 */
function isClimbingMove(state: GameState, entity: Entity): boolean {
	const gnome = state.gnomes.get(entity);
	const position = state.positions.get(entity);

	if (!gnome || !position || !gnome.path || gnome.pathIndex >= gnome.path.length) {
		return false;
	}

	const target = gnome.path[gnome.pathIndex]!;
	const dx = Math.abs(target.x - position.x);
	const dy = target.y - position.y;

	// Climbing is vertical movement (dy != 0) with minimal horizontal (dx < 0.5)
	// and requires a climbable surface
	if (dx < 0.5 && dy !== 0) {
		const surface = getClimbableSurface(state, position.x, position.y);
		return surface !== ClimbableSurfaceType.None;
	}

	return false;
}

/**
 * Climbing system update.
 * Manages climbing state transitions for all gnomes.
 */
export function climbingSystem(state: GameState): GameState {
	let currentState = state;

	const gnomeEntities = getEntitiesWithGnome(currentState);
	for (const entity of gnomeEntities) {
		currentState = updateGnomeClimbing(currentState, entity);
	}

	return currentState;
}

/**
 * Update climbing state for a single gnome.
 */
function updateGnomeClimbing(state: GameState, entity: Entity): GameState {
	const gnome = state.gnomes.get(entity);
	const position = state.positions.get(entity);

	if (!gnome || !position) return state;

	// Skip incapacitated gnomes
	if (gnome.state === GnomeState.Incapacitated) return state;

	// Check if Walking gnome should transition to Climbing
	if (gnome.state === GnomeState.Walking && isClimbingMove(state, entity)) {
		return updateGnome(state, entity, (g) => ({
			...g,
			state: GnomeState.Climbing
		}));
	}

	// Check for fall risk while climbing
	if (gnome.state === GnomeState.Climbing && shouldFall(state, entity)) {
		// Trigger fall - transition to Falling and record fall start position
		return updateGnome(state, entity, (g) => ({
			...g,
			state: GnomeState.Falling,
			fallStartY: position.y,
			path: null,
			pathIndex: 0,
			currentTaskId: null
		}));
	}

	// Check if Climbing gnome should transition to Walking (no longer climbing)
	if (gnome.state === GnomeState.Climbing && !isClimbingMove(state, entity)) {
		return updateGnome(state, entity, (g) => ({
			...g,
			state: GnomeState.Walking
		}));
	}

	return state;
}
