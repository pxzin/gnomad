/**
 * Idle Behavior System
 *
 * Assigns and updates idle behaviors for gnomes without tasks.
 * Gnomes can stroll, socialize, or rest when idle.
 */

import type { GameState } from '$lib/game/state';
import type { Entity } from '$lib/ecs/types';
import type { Position } from '$lib/components/position';
import type { IdleBehavior, IdleBehaviorType, Gnome } from '$lib/components/gnome';
import { GnomeState } from '$lib/components/gnome';
import { getEntitiesWithGnome, updateGnome } from '$lib/ecs/world';
import {
	IDLE_BEHAVIOR_THROTTLE_TICKS,
	IDLE_STROLL_MAX_RADIUS,
	IDLE_STROLL_MIN_RADIUS,
	SOCIALIZATION_MAX_DISTANCE
} from '$lib/config/performance';
import {
	IDLE_BEHAVIOR_WEIGHTS,
	REST_MIN_DURATION_TICKS,
	REST_MAX_DURATION_TICKS,
	SOCIALIZE_MIN_DURATION_TICKS,
	SOCIALIZE_MAX_DURATION_TICKS,
	STROLL_PAUSE_DURATION_TICKS
} from '$lib/config/idle-behavior';
import { findPath } from './pathfinding';
import { isWalkable, isSolid, isInBounds } from '$lib/world-gen/generator';

/**
 * Find the colony center (first Storage position).
 * Returns null if no Storage exists.
 */
export function findColonyCenter(state: GameState): Position | null {
	for (const [entity] of state.storages) {
		const pos = state.positions.get(entity);
		if (pos) return pos;
	}
	return null;
}

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
 * Create a seeded random function for a specific gnome and tick.
 * Ensures deterministic behavior selection.
 */
export function createSeededRandom(gameSeed: number, entity: Entity, tick: number): () => number {
	const combinedSeed = gameSeed ^ (entity * 31) ^ (tick * 17);
	return mulberry32(combinedSeed);
}

/**
 * Select a random walkable destination for strolling.
 * Uses horizontal movement with surface detection for valid positions.
 * Returns null if no valid destination can be found.
 */
function selectRandomStrollDestination(
	state: GameState,
	gnomePos: Position,
	colonyCenter: Position | null,
	random: () => number
): Position | null {
	// Use colony center if available, otherwise use gnome's current position
	const centerX = colonyCenter ? Math.floor(colonyCenter.x) : Math.floor(gnomePos.x);
	const gnomeY = Math.floor(gnomePos.y);

	// Try up to 10 times to find a valid destination
	for (let attempt = 0; attempt < 10; attempt++) {
		// Random horizontal distance (positive or negative)
		const direction = random() < 0.5 ? -1 : 1;
		const distance = IDLE_STROLL_MIN_RADIUS + Math.floor(random() * (IDLE_STROLL_MAX_RADIUS - IDLE_STROLL_MIN_RADIUS));
		const targetX = centerX + direction * distance;

		// Skip if out of bounds
		if (targetX < 1 || targetX >= state.worldWidth - 1) continue;

		// Find walkable Y position near the gnome's current Y level
		// Search from gnome's Y level up and down to find valid ground
		for (let yOffset = 0; yOffset <= 5; yOffset++) {
			for (const dy of yOffset === 0 ? [0] : [-yOffset, yOffset]) {
				const targetY = gnomeY + dy;

				if (targetY < 1 || targetY >= state.worldHeight - 1) continue;

				// Check if this is a valid walkable position (air with solid below)
				if (
					isInBounds(state, targetX, targetY) &&
					isWalkable(state, targetX, targetY) &&
					isSolid(state, targetX, targetY + 1)
				) {
					return { x: targetX, y: targetY };
				}
			}
		}
	}

	return null;
}

/**
 * Assign stroll behavior to a gnome.
 */
function assignStrollBehavior(
	state: GameState,
	entity: Entity,
	gnome: Gnome,
	colonyCenter: Position | null,
	random: () => number
): GameState {
	const gnomePos = state.positions.get(entity);
	if (!gnomePos) return state;

	// Find a valid stroll destination
	const destination = selectRandomStrollDestination(state, gnomePos, colonyCenter, random);
	if (!destination) {
		// Fall back to resting if no valid destination
		return assignRestBehavior(state, entity, random);
	}

	// Find path to destination
	const gnomeX = Math.floor(gnomePos.x);
	const gnomeY = Math.floor(gnomePos.y);
	const path = findPath(state, gnomeX, gnomeY, destination.x, destination.y);

	if (!path || path.length === 0) {
		// Fall back to resting if no path exists
		return assignRestBehavior(state, entity, random);
	}

	// Create stroll behavior
	const behavior: IdleBehavior = {
		type: 'strolling',
		startedAt: state.tick,
		endsAt: state.tick + 3600, // Will end when destination reached (timeout fallback: 1 min)
		targetX: destination.x,
		targetY: destination.y
	};

	return updateGnome(state, entity, (g) => ({
		...g,
		state: GnomeState.Walking,
		idleBehavior: behavior,
		path: path,
		pathIndex: 0
	}));
}

/**
 * Update stroll behavior.
 * Checks if gnome reached destination or path is complete.
 */
function updateStrollBehavior(state: GameState, entity: Entity, gnome: Gnome): GameState {
	if (!gnome.idleBehavior || gnome.idleBehavior.type !== 'strolling') return state;

	// Check if gnome reached destination (path complete and now idle)
	if (gnome.state === GnomeState.Idle && (!gnome.path || gnome.pathIndex >= gnome.path.length)) {
		// Stroll complete - clear behavior and add pause
		return updateGnome(state, entity, (g) => ({
			...g,
			state: GnomeState.Idle,
			idleBehavior: null,
			path: null,
			pathIndex: 0
		}));
	}

	// Check for timeout (stroll taking too long)
	if (state.tick >= gnome.idleBehavior.endsAt) {
		return updateGnome(state, entity, (g) => ({
			...g,
			state: GnomeState.Idle,
			idleBehavior: null,
			path: null,
			pathIndex: 0
		}));
	}

	return state;
}

/**
 * Find a nearby idle gnome for socialization.
 */
function findNearbyIdleGnome(
	state: GameState,
	gnomeEntity: Entity,
	gnomePos: Position
): Entity | null {
	for (const [otherEntity, otherGnome] of state.gnomes) {
		if (otherEntity === gnomeEntity) continue;
		if (otherGnome.state !== GnomeState.Idle) continue;
		if (otherGnome.idleBehavior?.type === 'socializing') continue; // Already in conversation
		if (otherGnome.currentTaskId !== null) continue; // Has task assigned

		const otherPos = state.positions.get(otherEntity);
		if (!otherPos) continue;

		// Manhattan distance check
		const distance = Math.abs(gnomePos.x - otherPos.x) + Math.abs(gnomePos.y - otherPos.y);
		if (distance <= SOCIALIZATION_MAX_DISTANCE) {
			return otherEntity;
		}
	}
	return null;
}

/**
 * Assign socialize behavior to a gnome pair.
 */
function assignSocializeBehavior(
	state: GameState,
	entity: Entity,
	partnerEntity: Entity,
	random: () => number
): GameState {
	// Calculate random duration
	const duration =
		SOCIALIZE_MIN_DURATION_TICKS +
		Math.floor(random() * (SOCIALIZE_MAX_DURATION_TICKS - SOCIALIZE_MIN_DURATION_TICKS));

	const endsAt = state.tick + duration;

	// Create behavior for both gnomes
	const behavior: IdleBehavior = {
		type: 'socializing',
		startedAt: state.tick,
		endsAt: endsAt,
		partnerEntity: partnerEntity
	};

	const partnerBehavior: IdleBehavior = {
		type: 'socializing',
		startedAt: state.tick,
		endsAt: endsAt,
		partnerEntity: entity
	};

	// Update both gnomes
	let currentState = updateGnome(state, entity, (g) => ({
		...g,
		idleBehavior: behavior
	}));

	currentState = updateGnome(currentState, partnerEntity, (g) => ({
		...g,
		idleBehavior: partnerBehavior
	}));

	return currentState;
}

/**
 * Update socialize behavior.
 * Ends socialization when duration is complete.
 */
function updateSocializeBehavior(state: GameState, entity: Entity, gnome: Gnome): GameState {
	if (!gnome.idleBehavior || gnome.idleBehavior.type !== 'socializing') return state;

	// Check if socialization ended
	if (state.tick >= gnome.idleBehavior.endsAt) {
		// Clear our behavior (partner will clear theirs on their update)
		return updateGnome(state, entity, (g) => ({
			...g,
			idleBehavior: null
		}));
	}

	// Check if partner no longer exists or stopped socializing
	if (gnome.idleBehavior.partnerEntity) {
		const partner = state.gnomes.get(gnome.idleBehavior.partnerEntity);
		if (!partner || partner.idleBehavior?.type !== 'socializing') {
			// Partner stopped - end our socialization too
			return updateGnome(state, entity, (g) => ({
				...g,
				idleBehavior: null
			}));
		}
	}

	return state;
}

/**
 * Assign rest behavior to a gnome.
 */
function assignRestBehavior(state: GameState, entity: Entity, random: () => number): GameState {
	// Calculate random duration
	const duration =
		REST_MIN_DURATION_TICKS +
		Math.floor(random() * (REST_MAX_DURATION_TICKS - REST_MIN_DURATION_TICKS));

	const behavior: IdleBehavior = {
		type: 'resting',
		startedAt: state.tick,
		endsAt: state.tick + duration
	};

	return updateGnome(state, entity, (g) => ({
		...g,
		idleBehavior: behavior
	}));
}

/**
 * Update rest behavior.
 * Ends rest when duration is complete.
 */
function updateRestBehavior(state: GameState, entity: Entity, gnome: Gnome): GameState {
	if (!gnome.idleBehavior || gnome.idleBehavior.type !== 'resting') return state;

	// Check if rest ended
	if (state.tick >= gnome.idleBehavior.endsAt) {
		return updateGnome(state, entity, (g) => ({
			...g,
			idleBehavior: null
		}));
	}

	return state;
}

/**
 * Idle behavior system update.
 * Assigns idle behaviors to gnomes without tasks.
 * Throttled to run every IDLE_BEHAVIOR_THROTTLE_TICKS ticks.
 */
export function idleBehaviorSystem(state: GameState): GameState {
	// Throttle: only run every N ticks to reduce CPU load
	if (state.tick % IDLE_BEHAVIOR_THROTTLE_TICKS !== 0) {
		return state;
	}

	let currentState = state;

	// Find colony center (Storage position)
	const colonyCenter = findColonyCenter(currentState);

	// Get all gnome entities
	const gnomeEntities = getEntitiesWithGnome(currentState);

	// Process each gnome
	for (const entity of gnomeEntities) {
		const gnome = currentState.gnomes.get(entity);
		if (!gnome) continue;

		// Skip gnomes with tasks
		if (gnome.currentTaskId !== null) continue;

		if (gnome.idleBehavior) {
			// Update existing behavior based on type
			switch (gnome.idleBehavior.type) {
				case 'strolling':
					currentState = updateStrollBehavior(currentState, entity, gnome);
					break;
				case 'socializing':
					currentState = updateSocializeBehavior(currentState, entity, gnome);
					break;
				case 'resting':
					currentState = updateRestBehavior(currentState, entity, gnome);
					break;
			}
		} else {
			// Assign new idle behavior (only if truly idle with no path)
			if (gnome.state === GnomeState.Idle && (!gnome.path || gnome.pathIndex >= gnome.path.length)) {
				currentState = assignIdleBehavior(currentState, entity, colonyCenter);
			}
		}
	}

	return currentState;
}

/**
 * Assign a new idle behavior to a gnome.
 * Uses weighted random selection.
 */
function assignIdleBehavior(
	state: GameState,
	entity: Entity,
	colonyCenter: Position | null
): GameState {
	const gnome = state.gnomes.get(entity);
	if (!gnome) return state;

	const gnomePos = state.positions.get(entity);
	if (!gnomePos) return state;

	// Create seeded random for this gnome/tick
	const random = createSeededRandom(state.seed, entity, state.tick);

	// Weighted random selection (0-100)
	const roll = random() * 100;

	// Check for socialization first if roll indicates it
	if (roll >= IDLE_BEHAVIOR_WEIGHTS.stroll && roll < IDLE_BEHAVIOR_WEIGHTS.stroll + IDLE_BEHAVIOR_WEIGHTS.socialize) {
		// Try to find a nearby idle gnome to socialize with
		const partner = findNearbyIdleGnome(state, entity, gnomePos);
		if (partner) {
			return assignSocializeBehavior(state, entity, partner, random);
		}
		// No partner found - fall back to stroll
	}

	// Assign behavior based on weighted roll
	if (roll < IDLE_BEHAVIOR_WEIGHTS.stroll) {
		return assignStrollBehavior(state, entity, gnome, colonyCenter, random);
	} else if (roll < IDLE_BEHAVIOR_WEIGHTS.stroll + IDLE_BEHAVIOR_WEIGHTS.socialize) {
		// Already tried socialization above and failed - fall back to stroll
		return assignStrollBehavior(state, entity, gnome, colonyCenter, random);
	} else {
		return assignRestBehavior(state, entity, random);
	}
}
