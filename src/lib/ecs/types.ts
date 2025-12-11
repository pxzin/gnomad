/**
 * ECS Core Types
 *
 * Entity-Component-System architecture following constitution principles:
 * - Entities are unique numeric identifiers
 * - Components are plain data objects (no methods)
 * - Systems are pure functions operating on component data
 */

/**
 * Entity is a unique identifier for any game object.
 * Components are associated with entities via Maps in GameState.
 */
export type Entity = number;

/**
 * Component type mapping for type-safe component access.
 */
export interface Components {
	position: import('$lib/components/position').Position;
	velocity: import('$lib/components/velocity').Velocity;
	tile: import('$lib/components/tile').Tile;
	gnome: import('$lib/components/gnome').Gnome;
	task: import('$lib/components/task').Task;
}

/**
 * Component type names for runtime access.
 */
export type ComponentType = keyof Components;
