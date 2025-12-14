/**
 * Storage Component
 *
 * Storage building for deposited resources.
 */

import { ResourceType } from './resource';

/**
 * Storage component data.
 * Contains deposited resources.
 */
export interface Storage {
	/** Map of resource type to count */
	contents: Map<ResourceType, number>;
}

/**
 * Create a new empty Storage component.
 */
export function createStorage(): Storage {
	return {
		contents: new Map()
	};
}

/**
 * Add resources to storage.
 */
export function addToStorage(storage: Storage, type: ResourceType, count: number = 1): Storage {
	const newContents = new Map(storage.contents);
	const current = newContents.get(type) ?? 0;
	newContents.set(type, current + count);
	return { contents: newContents };
}

/**
 * Get total count of a resource type in storage.
 */
export function getStorageCount(storage: Storage, type: ResourceType): number {
	return storage.contents.get(type) ?? 0;
}

/**
 * Get total items in storage.
 */
export function getStorageTotal(storage: Storage): number {
	let total = 0;
	for (const count of storage.contents.values()) {
		total += count;
	}
	return total;
}
