/**
 * Pathfinding System
 *
 * A* pathfinding for gnome navigation.
 * Supports walking, climbing, and vertical shaft traversal.
 */

import type { GameState } from '$lib/game/state';
import type { Position } from '$lib/components/position';
import { isWalkable, isSolid, isInBounds } from '$lib/world-gen/generator';

/**
 * Movement costs.
 */
const COST_WALK = 1; // Normal horizontal movement
const COST_STEP_UP = 2; // Step up one tile (like stairs)
const COST_STEP_DOWN = 1; // Step down one tile
const COST_CLIMB = 5; // Climb vertically (wall climbing penalty)
const COST_FALL = 1; // Falling down

/**
 * Neighbor with movement cost.
 */
interface Neighbor {
	x: number;
	y: number;
	cost: number;
}

/**
 * Pathfinding node for A*.
 */
interface PathNode {
	x: number;
	y: number;
	g: number; // Cost from start
	h: number; // Heuristic cost to end
	f: number; // Total cost (g + h)
	parent: PathNode | null;
}

/**
 * Find a path from start to end position.
 * Returns array of positions to follow, or null if no path exists.
 */
export function findPath(
	state: GameState,
	startX: number,
	startY: number,
	endX: number,
	endY: number
): Position[] | null {
	// If target is solid, find adjacent walkable tile
	if (isSolid(state, endX, endY)) {
		const adjacentTarget = findAdjacentWalkable(state, endX, endY);
		if (!adjacentTarget) return null;
		endX = adjacentTarget.x;
		endY = adjacentTarget.y;
	}

	// Simple case: already at destination
	if (startX === endX && startY === endY) {
		return [{ x: endX, y: endY }];
	}

	// A* pathfinding
	const openSet: PathNode[] = [];
	const closedSet = new Set<string>();

	const startNode: PathNode = {
		x: startX,
		y: startY,
		g: 0,
		h: heuristic(startX, startY, endX, endY),
		f: 0,
		parent: null
	};
	startNode.f = startNode.g + startNode.h;
	openSet.push(startNode);

	const maxIterations = 1000; // Prevent infinite loops
	let iterations = 0;

	while (openSet.length > 0 && iterations < maxIterations) {
		iterations++;

		// Find node with lowest f cost
		openSet.sort((a, b) => a.f - b.f);
		const current = openSet.shift()!;

		// Check if we reached the goal
		if (current.x === endX && current.y === endY) {
			return reconstructPath(current);
		}

		closedSet.add(`${current.x},${current.y}`);

		// Check neighbors
		const neighbors = getNeighbors(state, current.x, current.y);
		for (const neighbor of neighbors) {
			const key = `${neighbor.x},${neighbor.y}`;
			if (closedSet.has(key)) continue;

			const g = current.g + neighbor.cost; // Variable cost based on movement type
			const h = heuristic(neighbor.x, neighbor.y, endX, endY);
			const f = g + h;

			// Check if already in open set with better cost
			const existingIndex = openSet.findIndex((n) => n.x === neighbor.x && n.y === neighbor.y);
			if (existingIndex !== -1) {
				if (g < openSet[existingIndex]!.g) {
					openSet[existingIndex]!.g = g;
					openSet[existingIndex]!.f = f;
					openSet[existingIndex]!.parent = current;
				}
				continue;
			}

			openSet.push({
				x: neighbor.x,
				y: neighbor.y,
				g,
				h,
				f,
				parent: current
			});
		}
	}

	// No path found
	return null;
}

/**
 * Manhattan distance heuristic.
 */
function heuristic(x1: number, y1: number, x2: number, y2: number): number {
	return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * Check if gnome can climb at position (has adjacent wall to hold onto).
 */
function canClimb(state: GameState, x: number, y: number): boolean {
	// Can climb if there's a solid wall on either side
	return isSolid(state, x - 1, y) || isSolid(state, x + 1, y);
}

/**
 * Get walkable neighbors for a position with movement costs.
 * Gnomes can:
 * - Walk horizontally (cost: 1)
 * - Step up/down one tile (cost: 2/1)
 * - Climb vertically in shafts (cost: 5) - requires adjacent wall
 * - Fall down (cost: 1)
 */
function getNeighbors(state: GameState, x: number, y: number): Neighbor[] {
	const neighbors: Neighbor[] = [];

	// Horizontal movement (left/right)
	for (const dx of [-1, 1]) {
		const nx = x + dx;

		// Walk on same level (need ground below destination)
		if (isInBounds(state, nx, y) && isWalkable(state, nx, y) && isSolid(state, nx, y + 1)) {
			neighbors.push({ x: nx, y, cost: COST_WALK });
		}

		// Step up one tile (destination has ground = the tile we step onto)
		if (
			isInBounds(state, nx, y - 1) &&
			isWalkable(state, nx, y - 1) &&
			isSolid(state, nx, y) // Ground at destination
		) {
			neighbors.push({ x: nx, y: y - 1, cost: COST_STEP_UP });
		}

		// Step down one tile
		if (
			isInBounds(state, nx, y + 1) &&
			isWalkable(state, nx, y + 1) &&
			isSolid(state, nx, y + 2) // Ground below destination
		) {
			neighbors.push({ x: nx, y: y + 1, cost: COST_STEP_DOWN });
		}
	}

	// Vertical climbing (in shafts with walls to hold)
	// Climb UP - requires walkable space above and a wall to hold
	if (isInBounds(state, x, y - 1) && isWalkable(state, x, y - 1) && canClimb(state, x, y - 1)) {
		neighbors.push({ x, y: y - 1, cost: COST_CLIMB });
	}

	// Climb DOWN - can descend in a shaft with walls
	if (isInBounds(state, x, y + 1) && isWalkable(state, x, y + 1) && canClimb(state, x, y + 1)) {
		neighbors.push({ x, y: y + 1, cost: COST_CLIMB });
	}

	// Free fall (down if no ground and not already added as climb)
	if (isInBounds(state, x, y + 1) && isWalkable(state, x, y + 1) && !isSolid(state, x, y + 1)) {
		// Check if we didn't already add this as a climb move
		const alreadyAdded = neighbors.some((n) => n.x === x && n.y === y + 1);
		if (!alreadyAdded) {
			neighbors.push({ x, y: y + 1, cost: COST_FALL });
		}
	}

	return neighbors;
}

/**
 * Reconstruct path from goal node to start.
 */
function reconstructPath(node: PathNode): Position[] {
	const path: Position[] = [];
	let current: PathNode | null = node;

	while (current !== null) {
		path.unshift({ x: current.x, y: current.y });
		current = current.parent;
	}

	// Remove start position (gnome is already there)
	if (path.length > 0) {
		path.shift();
	}

	return path;
}

/**
 * Find an adjacent walkable tile to a solid tile.
 * Useful for finding where to stand when mining.
 * Checks: left, right, above (standing on target), below (for digging up).
 */
function findAdjacentWalkable(
	state: GameState,
	x: number,
	y: number
): { x: number; y: number } | null {
	// Check left and right of target (need ground below to stand)
	for (const dx of [-1, 1]) {
		const nx = x + dx;
		if (isInBounds(state, nx, y) && isWalkable(state, nx, y) && isSolid(state, nx, y + 1)) {
			return { x: nx, y };
		}
	}

	// Check above target (standing ON the target tile)
	if (isInBounds(state, x, y - 1) && isWalkable(state, x, y - 1) && isSolid(state, x, y)) {
		return { x, y: y - 1 };
	}

	// Check below target (for digging UP - gnome stands below and digs ceiling)
	// Need ground below gnome position OR ability to climb (wall adjacent)
	if (isInBounds(state, x, y + 1) && isWalkable(state, x, y + 1)) {
		const belowY = y + 1;
		// Can stand here if there's ground below OR walls to hold onto
		if (isSolid(state, x, belowY + 1) || canClimb(state, x, belowY)) {
			return { x, y: belowY };
		}
	}

	// Check diagonal positions (for harder to reach tiles)
	for (const dx of [-1, 1]) {
		const nx = x + dx;
		// Diagonal above
		if (
			isInBounds(state, nx, y - 1) &&
			isWalkable(state, nx, y - 1) &&
			(isSolid(state, nx, y) || canClimb(state, nx, y - 1))
		) {
			return { x: nx, y: y - 1 };
		}
		// Diagonal below
		if (
			isInBounds(state, nx, y + 1) &&
			isWalkable(state, nx, y + 1) &&
			(isSolid(state, nx, y + 2) || canClimb(state, nx, y + 1))
		) {
			return { x: nx, y: y + 1 };
		}
	}

	return null;
}
