/**
 * Climbing Component Types
 *
 * Types for climbing surface detection and modifiers.
 */

/**
 * Types of surfaces a gnome can climb.
 * Priority order: BlockEdge > BackgroundBlock > CaveBackground > None
 */
export enum ClimbableSurfaceType {
	/** Adjacent foreground block - best grip */
	BlockEdge = 'block_edge',
	/** Background tile present - moderate grip */
	BackgroundBlock = 'background_block',
	/** Cave permanent background (below horizon) - poor grip */
	CaveBackground = 'cave_background',
	/** Sky or no surface - not climbable */
	None = 'none'
}

/**
 * Modifiers applied when climbing a specific surface type.
 */
export interface SurfaceModifier {
	/** Multiplier applied to base climb speed (1.0 = full speed) */
	speedMultiplier: number;
	/** Multiplier applied to base fall chance (1.0 = base chance) */
	fallChanceMultiplier: number;
	/** Cost for A* pathfinding when climbing this surface */
	pathfindingCost: number;
}
