/**
 * Climbing Constants
 *
 * Values that control climbing behavior and fall mechanics.
 */

import { ClimbableSurfaceType, type SurfaceModifier } from '$lib/components/climbing';

// Climbing Movement
/** Base climb speed (30% of GNOME_SPEED 0.1) */
export const GNOME_CLIMB_SPEED = 0.03;

// Fall Mechanics
/** Per-tick fall probability while climbing (~6% over 60 ticks) */
export const BASE_FALL_CHANCE = 0.001;
/** Minimum tiles to fall before taking damage */
export const FALL_DAMAGE_THRESHOLD = 3;
/** Damage per tile above threshold (damage = (height - 2) * 10) */
export const FALL_DAMAGE_PER_TILE = 10;

/**
 * Surface-specific climbing modifiers.
 * Affects speed, fall chance, and pathfinding cost.
 */
export const SURFACE_MODIFIERS: Record<ClimbableSurfaceType, SurfaceModifier> = {
	[ClimbableSurfaceType.BlockEdge]: {
		speedMultiplier: 1.0,
		fallChanceMultiplier: 1.0,
		pathfindingCost: 5
	},
	[ClimbableSurfaceType.BackgroundBlock]: {
		speedMultiplier: 0.8,
		fallChanceMultiplier: 1.2,
		pathfindingCost: 6
	},
	[ClimbableSurfaceType.CaveBackground]: {
		speedMultiplier: 0.6,
		fallChanceMultiplier: 1.5,
		pathfindingCost: 8
	},
	[ClimbableSurfaceType.None]: {
		speedMultiplier: 0,
		fallChanceMultiplier: 0,
		pathfindingCost: Infinity
	}
};
