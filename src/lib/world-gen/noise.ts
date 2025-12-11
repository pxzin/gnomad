/**
 * Seeded PRNG
 *
 * Deterministic random number generation using mulberry32 algorithm.
 * Ensures reproducible world generation from a given seed.
 */

/**
 * Create a seeded random number generator using mulberry32.
 * Returns a function that produces deterministic random numbers in [0, 1).
 *
 * @param seed - The seed value for the PRNG
 * @returns A function that returns the next random number
 */
export function createRNG(seed: number): () => number {
	let state = seed >>> 0; // Ensure unsigned 32-bit integer

	return function mulberry32(): number {
		state |= 0;
		state = (state + 0x6d2b79f5) | 0;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/**
 * PRNG state that can be serialized and restored.
 */
export interface RNGState {
	seed: number;
	calls: number;
}

/**
 * Create a seedable PRNG with state tracking.
 * Useful for save/load when exact RNG state must be preserved.
 */
export function createTrackableRNG(seed: number): {
	random: () => number;
	getState: () => RNGState;
} {
	const rng = createRNG(seed);
	let calls = 0;

	return {
		random: () => {
			calls++;
			return rng();
		},
		getState: () => ({ seed, calls })
	};
}

/**
 * Restore a PRNG to a specific state by replaying calls.
 */
export function restoreRNG(state: RNGState): () => number {
	const rng = createRNG(state.seed);
	// Replay all previous calls to restore state
	for (let i = 0; i < state.calls; i++) {
		rng();
	}
	return rng;
}

/**
 * Generate a random integer in range [min, max] inclusive.
 */
export function randomInt(rng: () => number, min: number, max: number): number {
	return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * Generate a random float in range [min, max).
 */
export function randomFloat(rng: () => number, min: number, max: number): number {
	return rng() * (max - min) + min;
}

/**
 * Pick a random element from an array.
 */
export function randomPick<T>(rng: () => number, array: readonly T[]): T | undefined {
	if (array.length === 0) return undefined;
	return array[Math.floor(rng() * array.length)];
}

/**
 * Shuffle an array in place using Fisher-Yates algorithm.
 */
export function shuffle<T>(rng: () => number, array: T[]): T[] {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		const temp = array[i];
		array[i] = array[j]!;
		array[j] = temp!;
	}
	return array;
}

/**
 * Generate a deterministic seed from a string.
 */
export function seedFromString(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = ((hash << 5) - hash + char) | 0;
	}
	return hash >>> 0; // Ensure positive
}

/**
 * Simple 1D Perlin-like noise for terrain generation.
 * Uses interpolated random values for smooth terrain heights.
 */
export function noise1D(rng: () => number, x: number, frequency: number = 0.1): number {
	const scaledX = x * frequency;
	const x0 = Math.floor(scaledX);
	const x1 = x0 + 1;
	const t = scaledX - x0;

	// Generate deterministic values at integer points
	// Note: This is simplified; for real noise, you'd want a hash function
	const tempRng0 = createRNG(x0 * 12345);
	const tempRng1 = createRNG(x1 * 12345);
	const v0 = tempRng0();
	const v1 = tempRng1();

	// Smoothstep interpolation
	const smoothT = t * t * (3 - 2 * t);
	return v0 + (v1 - v0) * smoothT;
}
