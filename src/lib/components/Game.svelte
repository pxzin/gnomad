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
		type Renderer
	} from '$lib/render/renderer';
	import { createInputHandlers, type InputHandlers } from '$lib/input/handler';
	import type { Command } from '$lib/game/commands';
	import { spawnGnomeCommand } from '$lib/game/commands';
	import { saveToLocalStorage, loadFromLocalStorage } from '$lib/game/state';

	// Props
	export let worldConfig: Partial<WorldConfig> = {};

	// Save/load status
	let saveMessage = '';

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
				if (renderer) {
					render(renderer, state, interpolation);
				}
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

	// Get gnome count for display
	$: gnomeCount = gameLoop?.state.gnomes.size ?? 0;
</script>

<div class="game-container">
	<canvas bind:this={canvas}></canvas>

	{#if gameLoop}
		<div class="hud">
			<div class="hud-item">
				Tick: {gameLoop.state.tick}
			</div>
			<div class="hud-item">
				Speed: {gameLoop.state.speed}x
				{#if gameLoop.state.isPaused}
					<span class="paused">(PAUSED)</span>
				{/if}
			</div>
			<div class="hud-item">
				Gnomes: {gameLoop.state.gnomes.size}
			</div>
			<div class="hud-item">
				Tasks: {gameLoop.state.tasks.size}
			</div>
			<div class="hud-item">
				Selected: {gameLoop.state.selectedTiles.length}
			</div>
			<button class="spawn-button" onclick={handleSpawnGnome}>+ Gnome</button>
		</div>

		<div class="controls">
			<p><strong>Controls:</strong></p>
			<p>Left click: Select tiles</p>
			<p>Right/Middle drag: Pan camera</p>
			<p>Scroll: Zoom</p>
			<p>D: Dig selected tiles</p>
			<p>Space: Pause/Resume</p>
			<p>1/2/3: Speed (0.5x/1x/2x)</p>
			<p>Esc: Clear selection</p>
		</div>

		<div class="save-load">
			<button onclick={handleSave}>Save</button>
			<button onclick={handleLoad}>Load</button>
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

	.hud {
		position: absolute;
		top: 10px;
		left: 10px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 10px;
		border-radius: 4px;
		font-family: monospace;
		font-size: 12px;
		pointer-events: none;
	}

	.hud-item {
		margin-bottom: 4px;
	}

	.spawn-button {
		margin-top: 8px;
		background: #4a9a4a;
		color: white;
		border: none;
		padding: 6px 12px;
		border-radius: 4px;
		cursor: pointer;
		font-family: monospace;
		font-size: 12px;
		pointer-events: auto;
	}

	.spawn-button:hover {
		background: #5aaa5a;
	}

	.paused {
		color: #ff6b6b;
		font-weight: bold;
	}

	.controls {
		position: absolute;
		bottom: 10px;
		left: 10px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 10px;
		border-radius: 4px;
		font-family: monospace;
		font-size: 11px;
		pointer-events: none;
	}

	.controls p {
		margin: 2px 0;
	}

	.save-load {
		position: absolute;
		top: 10px;
		right: 10px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 10px;
		border-radius: 4px;
		display: flex;
		gap: 8px;
		align-items: center;
		pointer-events: none;
	}

	.save-load button {
		background: #4a90a4;
		color: white;
		border: none;
		padding: 6px 12px;
		border-radius: 4px;
		cursor: pointer;
		font-family: monospace;
		font-size: 12px;
		pointer-events: auto;
	}

	.save-load button:hover {
		background: #5ba0b4;
	}

	.save-message {
		font-family: monospace;
		font-size: 11px;
		color: #90ee90;
	}
</style>
