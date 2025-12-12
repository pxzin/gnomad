/**
 * Binary Heap (Min-Heap)
 *
 * Efficient priority queue for A* pathfinding.
 * O(log n) insert and extract-min operations.
 */

export interface BinaryHeap<T> {
	/** Insert item maintaining heap property. O(log n) */
	push(item: T): void;

	/** Remove and return minimum item. O(log n) */
	pop(): T | undefined;

	/** View minimum item without removing. O(1) */
	peek(): T | undefined;

	/** Number of items in heap */
	readonly size: number;

	/** Check if heap is empty */
	readonly isEmpty: boolean;

	/** Remove all items. O(1) */
	clear(): void;
}

/**
 * Create a new binary heap with the given comparison function.
 * The comparison function should return negative if a < b, positive if a > b, zero if equal.
 */
export function createBinaryHeap<T>(compareFn: (a: T, b: T) => number): BinaryHeap<T> {
	const items: T[] = [];

	function siftUp(index: number): void {
		while (index > 0) {
			const parent = Math.floor((index - 1) / 2);
			if (compareFn(items[index]!, items[parent]!) >= 0) break;
			[items[index], items[parent]] = [items[parent]!, items[index]!];
			index = parent;
		}
	}

	function siftDown(index: number): void {
		const length = items.length;
		while (true) {
			const left = 2 * index + 1;
			const right = 2 * index + 2;
			let smallest = index;

			if (left < length && compareFn(items[left]!, items[smallest]!) < 0) {
				smallest = left;
			}
			if (right < length && compareFn(items[right]!, items[smallest]!) < 0) {
				smallest = right;
			}
			if (smallest === index) break;

			[items[index], items[smallest]] = [items[smallest]!, items[index]!];
			index = smallest;
		}
	}

	return {
		push(item: T): void {
			items.push(item);
			siftUp(items.length - 1);
		},

		pop(): T | undefined {
			if (items.length === 0) return undefined;
			const result = items[0];
			const last = items.pop();
			if (items.length > 0 && last !== undefined) {
				items[0] = last;
				siftDown(0);
			}
			return result;
		},

		peek(): T | undefined {
			return items[0];
		},

		get size(): number {
			return items.length;
		},

		get isEmpty(): boolean {
			return items.length === 0;
		},

		clear(): void {
			items.length = 0;
		}
	};
}
