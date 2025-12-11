/**
 * Game Loop
 *
 * Fixed timestep game loop with interpolation for rendering.
 * Runs at 60 ticks per second for deterministic simulation.
 */

import type { GameState } from './state';
import { updateCamera } from './state';
import type { Command } from './commands';
import { TICKS_PER_SECOND, MS_PER_TICK } from '$lib/config/timing';

// Re-export for backwards compatibility
export { TICKS_PER_SECOND, MS_PER_TICK };

/**
 * Game loop state - now a class for mutable state that can be shared.
 */
export class GameLoop {
	/** Current game state */
	state: GameState;
	/** Accumulated time for fixed timestep */
	accumulator: number = 0;
	/** Timestamp of last frame */
	lastTime: number = 0;
	/** Whether the loop is running */
	isRunning: boolean = false;
	/** Animation frame ID for cancellation */
	frameId: number | null = null;
	/** Pending commands to process */
	commandQueue: Command[] = [];

	constructor(initialState: GameState) {
		this.state = initialState;
	}
}

/**
 * Create a new game loop.
 */
export function createGameLoop(initialState: GameState): GameLoop {
	return new GameLoop(initialState);
}

/**
 * Command processor function type.
 */
export type CommandProcessor = (state: GameState, command: Command) => GameState;

/**
 * System update function type.
 */
export type SystemUpdate = (state: GameState) => GameState;

/**
 * Process a single simulation tick.
 */
export function processTick(
	state: GameState,
	commandQueue: Command[],
	processCommand: CommandProcessor,
	systems: SystemUpdate[]
): [GameState, Command[]] {
	let currentState = state;

	// Process all pending commands for this tick
	const remainingCommands: Command[] = [];
	for (const command of commandQueue) {
		currentState = processCommand(currentState, command);
	}

	// If not paused, run all systems and increment tick
	if (!currentState.isPaused) {
		for (const system of systems) {
			currentState = system(currentState);
		}

		currentState = {
			...currentState,
			tick: currentState.tick + 1
		};
	}

	// Always update camera (even when paused)
	currentState = updateCamera(currentState);

	return [currentState, remainingCommands];
}

/**
 * Calculate interpolation factor for smooth rendering.
 * Value between 0 and 1 representing progress to next tick.
 */
export function getInterpolation(accumulator: number): number {
	return accumulator / MS_PER_TICK;
}

/**
 * Start the game loop.
 */
export function startLoop(
	loop: GameLoop,
	processCommand: CommandProcessor,
	systems: SystemUpdate[],
	onRender: (state: GameState, interpolation: number) => void
): GameLoop {
	if (loop.isRunning) return loop;

	loop.isRunning = true;
	loop.lastTime = performance.now();

	function tick(currentTime: number) {
		if (!loop.isRunning) return;

		const deltaTime = currentTime - loop.lastTime;
		loop.lastTime = currentTime;
		loop.accumulator += deltaTime * loop.state.speed;

		// Process fixed timestep updates
		while (loop.accumulator >= MS_PER_TICK) {
			const [newState, remainingCommands] = processTick(
				loop.state,
				loop.commandQueue,
				processCommand,
				systems
			);
			loop.state = newState;
			loop.commandQueue = remainingCommands;
			loop.accumulator -= MS_PER_TICK;
		}

		// Render with interpolation
		const interpolation = getInterpolation(loop.accumulator);
		onRender(loop.state, interpolation);

		// Schedule next frame
		loop.frameId = requestAnimationFrame(tick);
	}

	loop.frameId = requestAnimationFrame(tick);
	return loop;
}

/**
 * Stop the game loop.
 */
export function stopLoop(loop: GameLoop): void {
	if (loop.frameId !== null) {
		cancelAnimationFrame(loop.frameId);
	}
	loop.isRunning = false;
	loop.frameId = null;
}

/**
 * Queue a command for processing.
 */
export function queueCommand(loop: GameLoop, command: Command): void {
	loop.commandQueue.push(command);
}

/**
 * Update game state directly (for external state changes).
 */
export function updateState(loop: GameLoop, state: GameState): void {
	loop.state = state;
}
