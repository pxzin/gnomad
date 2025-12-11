<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { generateWorld, type WorldConfig } from '$lib/world-gen/generator';
	import { spawnGnome } from '$lib/game/spawn';
	import {
		createGameLoop,
		startLoop,
		stopLoop,
		queueCommand,
		updateState,
		GameLoop
	} from '$lib/game/loop';
	import { processCommand } from '$lib/game/command-processor';
	import { physicsSystem } from '$lib/systems/physics';
	import { taskAssignmentSystem } from '$lib/systems/task-assignment';
	import { miningSystem } from '$lib/systems/mining';
	import {
		createRenderer,
		destroyRenderer,
		resizeRenderer,
		render,
		getFPS,
		type Renderer
	} from '$lib/render/renderer';
	import { createInputHandlers, type InputHandlers } from '$lib/input/handler';
	import type { Command } from '$lib/game/commands';
	import { spawnGnomeCommand } from '$lib/game/commands';
	import { saveToLocalStorage, loadFromLocalStorage, type GameState } from '$lib/game/state';
	import HudOverlay from './hud/HudOverlay.svelte';

	// Props
	interface Props {
		worldConfig?: Partial<WorldConfig>;
	}

	let { worldConfig = {} }: Props = $props();

	// Save/load status
	let saveMessage = $state('');

	// Reactive game state for HUD
	let gameState: GameState | null = $state(null);
	let fps: number = $state(0);

	// State
	let canvas: HTMLCanvasElement;
	let renderer: Renderer | null = null;
	let gameLoop: GameLoop | null = null;
	let inputHandlers: InputHandlers | null = null;

	// Systems to run each tick
	const systems = [physicsSystem, taskAssignmentSystem, miningSystem];

	// Initialize game
	onMount(() => {
		let resizeObserver: ResizeObserver | null = null;

		// Async initialization
		(async () => {
			// Generate world
			let state = generateWorld(worldConfig);

			// Spawn initial gnome
			const spawnResult = spawnGnome(state);
			if (spawnResult) {
				state = spawnResult[0];
			}

			// Create renderer
			renderer = await createRenderer(canvas);

			// Handle window resize
			resizeObserver = new ResizeObserver(() => {
				if (renderer && canvas.parentElement) {
					const { width, height } = canvas.parentElement.getBoundingClientRect();
					canvas.width = width;
					canvas.height = height;
					resizeRenderer(renderer, width, height);
				}
			});
			if (canvas.parentElement) {
				resizeObserver.observe(canvas.parentElement);
			}

			// Create game loop
			gameLoop = createGameLoop(state);

			// Create input handlers
			inputHandlers = createInputHandlers(
				canvas,
				() => renderer,
				() => gameLoop?.state ?? state,
				(command: Command) => {
					if (gameLoop) {
						queueCommand(gameLoop, command);
					}
				}
			);

			// Start game loop
			gameLoop = startLoop(gameLoop, processCommand, systems, (state, interpolation) => {
				// Process continuous input (keyboard pan)
				if (inputHandlers) {
					inputHandlers.update();
				}
				if (renderer) {
					render(renderer, state, interpolation);
					// Update FPS from renderer
					fps = getFPS(renderer);
				}
				// Update reactive state for HUD
				gameState = state;
			});
		})();

		return () => {
			if (resizeObserver) {
				resizeObserver.disconnect();
			}
		};
	});

	// Cleanup
	onDestroy(() => {
		if (inputHandlers) {
			inputHandlers.cleanup();
		}
		if (gameLoop) {
			stopLoop(gameLoop);
		}
		if (renderer) {
			destroyRenderer(renderer);
		}
	});

	// Save game to localStorage
	function handleSave() {
		if (gameLoop) {
			saveToLocalStorage(gameLoop.state);
			saveMessage = 'Game saved!';
			setTimeout(() => {
				saveMessage = '';
			}, 2000);
		}
	}

	// Load game from localStorage
	function handleLoad() {
		const loadedState = loadFromLocalStorage();
		if (loadedState && gameLoop) {
			updateState(gameLoop, loadedState);
			saveMessage = 'Game loaded!';
			setTimeout(() => {
				saveMessage = '';
			}, 2000);
		} else {
			saveMessage = 'No save found';
			setTimeout(() => {
				saveMessage = '';
			}, 2000);
		}
	}

	// Spawn a new gnome
	function handleSpawnGnome() {
		if (gameLoop) {
			queueCommand(gameLoop, spawnGnomeCommand());
		}
	}

	// Handle commands from HUD
	function handleCommand(command: Command) {
		if (gameLoop) {
			queueCommand(gameLoop, command);
		}
	}
</script>

<div class="game-container">
	<canvas bind:this={canvas}></canvas>

	{#if gameState}
		<HudOverlay state={gameState} {fps} onCommand={handleCommand} />

		<div class="save-load">
			<button onclick={handleSave}>Save</button>
			<button onclick={handleLoad}>Load</button>
			<button onclick={handleSpawnGnome}>+ Gnome</button>
			{#if saveMessage}
				<span class="save-message">{saveMessage}</span>
			{/if}
		</div>
	{/if}
</div>

<style>
	.game-container {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}

	.save-load {
		position: absolute;
		top: 50px;
		right: 10px;
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 8px 12px;
		border-radius: 4px;
		display: flex;
		gap: 8px;
		align-items: center;
		pointer-events: auto;
		z-index: 101;
	}

	.save-load button {
		background: #333;
		color: white;
		border: 1px solid #555;
		padding: 4px 8px;
		border-radius: 4px;
		cursor: pointer;
		font-family: monospace;
		font-size: 12px;
	}

	.save-load button:hover {
		background: #444;
		border-color: #666;
	}

	.save-message {
		font-family: monospace;
		font-size: 11px;
		color: #90ee90;
	}
</style>
