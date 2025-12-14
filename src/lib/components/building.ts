/**
 * Building Component
 *
 * Base component for all building types in the game.
 */

/**
 * Types of buildings that can be placed.
 */
export enum BuildingType {
	Storage = 'storage'
}

/**
 * Building component data.
 * Base component for all building types.
 */
export interface Building {
	/** Type of building */
	type: BuildingType;
	/** Width in tiles */
	width: number;
	/** Height in tiles */
	height: number;
}

/**
 * Building visual configuration.
 */
export interface BuildingConfig {
	/** Hex color for MVP rendering */
	color: number;
	/** Default dimensions */
	width: number;
	height: number;
}

/**
 * Building type configurations.
 */
export const BUILDING_CONFIG: Record<BuildingType, BuildingConfig> = {
	[BuildingType.Storage]: {
		color: 0x4a6fa5, // Steel blue
		width: 2,
		height: 2
	}
};

/**
 * Create a new Building component.
 */
export function createBuilding(type: BuildingType): Building {
	const config = BUILDING_CONFIG[type];
	return {
		type,
		width: config.width,
		height: config.height
	};
}
