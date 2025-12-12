/**
 * Tile Component
 *
 * Terrain tile data. Every non-air tile in the world has this component.
 */

/**
 * Types of terrain tiles.
 */
export enum TileType {
	Air = 0,
	Dirt = 1,
	Stone = 2,
	/** Indestructible barrier at world edges */
	Bedrock = 3
}

/**
 * Tile component data.
 */
export interface Tile {
	/** Type of terrain */
	type: TileType;
	/** Current durability (0 = mined/destroyed) */
	durability: number;
}

/**
 * Configuration for each tile type.
 */
export interface TileConfig {
	/** Initial durability when created */
	durability: number;
	/** Hex color for MVP rendering (colored squares) */
	color: number;
	/** Number of ticks to mine at base speed */
	mineTicks: number;
}

/**
 * Tile type configurations.
 */
export const TILE_CONFIG: Record<TileType, TileConfig> = {
	[TileType.Air]: { durability: 0, color: 0x87ceeb, mineTicks: 0 },
	[TileType.Dirt]: { durability: 100, color: 0x8b4513, mineTicks: 30 },
	[TileType.Stone]: { durability: 200, color: 0x808080, mineTicks: 90 },
	[TileType.Bedrock]: { durability: Infinity, color: 0x1a1a1a, mineTicks: Infinity }
};

/**
 * Check if a tile type is indestructible.
 */
export function isIndestructible(type: TileType): boolean {
	return type === TileType.Bedrock;
}

/**
 * Create a new Tile component.
 */
export function createTile(type: TileType): Tile {
	return {
		type,
		durability: TILE_CONFIG[type].durability
	};
}

/**
 * Create an Air tile component.
 */
export function createAirTile(): Tile {
	return {
		type: TileType.Air,
		durability: 0
	};
}
