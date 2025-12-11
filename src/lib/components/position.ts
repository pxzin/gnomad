/**
 * Position Component
 *
 * World position in tile coordinates.
 * Used by entities that can move between tiles (gnomes).
 */
export interface Position {
	/** Tile X coordinate (0 = left edge of world) */
	x: number;
	/** Tile Y coordinate (0 = top edge of world) */
	y: number;
}

/**
 * Create a new Position component.
 */
export function createPosition(x: number, y: number): Position {
	return { x, y };
}
