<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { generateWorld, type WorldConfig } from '$lib/world-gen/generator';
	import { spawnGnome, spawnStorage } from '$lib/game/spawn';
	import {
		createGameLoop,
		startLoop,
		stopLoop,
		queueCommand,
		updateState,
		GameLoop
	} from '$lib/game/loop';
	import { processCommand, canPlaceBuilding } from '$lib/game/command-processor';
	import { physicsSystem } from '$lib/systems/physics';
	import { taskAssignmentSystem } from '$lib/systems/task-assignment';
	import { miningSystem } from '$lib/systems/mining';
	import { boundsSystem } from '$lib/systems/bounds';
	import { resourceCollectionSystem } from '$lib/systems/resource-collection';
	import { resourcePhysicsSystem } from '$lib/systems/resource-physics';
	import { collectTaskSystem } from '$lib/systems/collect-task';
	import { depositSystem } from '$lib/systems/deposit';
	import {
		createRenderer,
		destroyRenderer,
		resizeRenderer,
		render,
		getFPS,
		screenToTile,
		type Renderer,
		type BuildPreview
	} from '$lib/render/renderer';
	import { createInputHandlers, type InputHandlers } from '$lib/input/handler';
	import type { Command } from '$lib/game/commands';
	import { spawnGnomeCommand, placeBuilding } from '$lib/game/commands';
	import { saveToLocalStorage, loadFromLocalStorage, type GameState } from '$lib/game/state';
	import { BuildingType } from '$lib/components/building';
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

	// Build mode
	let buildMode: BuildingType | null = $state(null);

	// Mouse position for build preview
	let mouseScreenX: number = $state(0);
	let mouseScreenY: number = $state(0);

	// Build preview (ghost)
	let buildPreview: BuildPreview | null = $derived.by(() => {
		if (!buildMode || !renderer || !gameState) return null;

		const tile = screenToTile(renderer, gameState, mouseScreenX, mouseScreenY);
		const isValid = canPlaceBuilding(gameState, buildMode, tile.x, tile.y);

		return {
			buildingType: buildMode,
			tileX: tile.x,
			tileY: tile.y,
			isValid
		};
	});

	// State
	let canvas: HTMLCanvasElement;
	let renderer: Renderer | null = null;
	let gameLoop: GameLoop | null = null;
	let inputHandlers: InputHandlers | null = null;
	let buildModeKeyHandler: ((e: KeyboardEvent) => void) | null = null;

	// Systems to run each tick
	// Order matters: deposit runs before task assignment so gnomes with items deposit first
	const systems = [
		physicsSystem,
		resourcePhysicsSystem,
		depositSystem, // Before task assignment - gnomes with items deposit first
		taskAssignmentSystem,
		miningSystem,
		collectTaskSystem,
		resourceCollectionSystem,
		boundsSystem
	];

	// Initialize game
	onMount(() => {
		let resizeObserver: ResizeObserver | null = null;

		// Async initialization
		(async () => {
			// Generate world
			let state = generateWorld(worldConfig);

			// Spawn initial storage (before gnome so it renders behind)
			const storageResult = spawnStorage(state);
			if (storageResult) {
				state = storageResult[0];
			}

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
				},
				() => buildMode !== null // Block input when in build mode
			);

			// Handle ESC to cancel build mode (before other key handlers)
			buildModeKeyHandler = (e: KeyboardEvent) => {
				if (e.key === 'Escape' && buildMode !== null) {
					buildMode = null;
					e.stopPropagation(); // Prevent other handlers from processing
				}
			};
			window.addEventListener('keydown', buildModeKeyHandler, true); // Capture phase

			// Start game loop
			gameLoop = startLoop(gameLoop, processCommand, systems, (state, interpolation) => {
				// Process continuous input (keyboard pan)
				if (inputHandlers) {
					inputHandlers.update();
				}
				if (renderer) {
					render(renderer, state, interpolation, buildPreview);
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
		if (buildModeKeyHandler) {
			window.removeEventListener('keydown', buildModeKeyHandler, true);
		}
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

	// Handle build mode toggle
	function handleSetBuildMode(mode: BuildingType | null) {
		buildMode = mode;
	}

	// Track mouse position for build preview
	function handleMouseMove(e: MouseEvent) {
		const rect = canvas.getBoundingClientRect();
		mouseScreenX = e.clientX - rect.left;
		mouseScreenY = e.clientY - rect.top;
	}

	// Handle canvas click for build mode
	function handleCanvasClick(e: MouseEvent) {
		if (!buildMode || !renderer || !gameLoop) return;

		// Only handle left clicks
		if (e.button !== 0) return;

		// Get click position in tile coordinates
		const rect = canvas.getBoundingClientRect();
		const screenX = e.clientX - rect.left;
		const screenY = e.clientY - rect.top;
		const tile = screenToTile(renderer, gameLoop.state, screenX, screenY);

		// Check if placement is valid before executing
		const isValid = canPlaceBuilding(gameLoop.state, buildMode, tile.x, tile.y);

		if (isValid) {
			// Place building at tile position
			queueCommand(gameLoop, placeBuilding(buildMode, tile.x, tile.y));
			// Exit build mode on success
			buildMode = null;
		}
		// On invalid placement, stay in build mode (the red preview provides feedback)
	}
</script>

<div class="game-container">
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<canvas
		bind:this={canvas}
		onclick={handleCanvasClick}
		onmousemove={handleMouseMove}
		class:build-mode={buildMode !== null}
	></canvas>

	{#if gameState}
		<HudOverlay state={gameState} {fps} {buildMode} onCommand={handleCommand} onSetBuildMode={handleSetBuildMode} />

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

	canvas.build-mode {
		cursor: crosshair;
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
