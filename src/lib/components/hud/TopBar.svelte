<script lang="ts">
	import type { GameState } from '$lib/game/state';
	import type { Command } from '$lib/game/commands';
	import { togglePause, setSpeed, GameSpeed, AVAILABLE_SPEEDS, SPEED_LABELS } from '$lib/game/commands';
	import { computeTaskProgress } from './types';
	import ResourcePanel from './ResourcePanel.svelte';

	interface Props {
		state: GameState;
		fps: number;
		onCommand: (command: Command) => void;
	}

	let { state, fps, onCommand }: Props = $props();

	// Derived state
	let gnomeCount = $derived(state.gnomes.size);
	let taskProgress = $derived(computeTaskProgress(state));
	let tick = $derived(state.tick);
	let isPaused = $derived(state.isPaused);
	let currentSpeed = $derived(state.speed);
	let inventory = $derived(state.inventory);

	// Speed control handlers
	function handlePause() {
		onCommand(togglePause());
	}

	function handleSetSpeed(speed: GameSpeed) {
		onCommand(setSpeed(speed));
	}
</script>

<div class="top-bar">
	<div class="left-section">
		<div class="stat-item">
			<span class="stat-label">Gnomes:</span>
			<span class="stat-value">{gnomeCount}</span>
		</div>
		<div class="stat-item">
			<span class="stat-label">Tasks:</span>
			<span class="stat-value">{taskProgress.assigned}/{taskProgress.total}</span>
		</div>
		<div class="stat-item">
			<span class="stat-label">Tick:</span>
			<span class="stat-value">{tick}</span>
		</div>
		<div class="stat-item">
			<span class="stat-label">FPS:</span>
			<span class="stat-value fps-value" class:fps-good={fps >= 55} class:fps-ok={fps >= 30 && fps < 55} class:fps-bad={fps < 30}>{Math.round(fps)}</span>
		</div>
	</div>

	<ResourcePanel {inventory} />

	<div class="right-section">
		<button
			class="control-button pause-button"
			class:active={isPaused}
			onclick={handlePause}
			title="Toggle pause (Space)"
		>
			{isPaused ? '▶' : '⏸'}
		</button>
		<div class="speed-controls">
			{#each AVAILABLE_SPEEDS as speed, index}
				<button
					class="control-button speed-button"
					class:active={currentSpeed === speed}
					onclick={() => handleSetSpeed(speed)}
					title="{SPEED_LABELS[speed]} speed ({index + 1})"
				>
					{SPEED_LABELS[speed]}
				</button>
			{/each}
		</div>
		{#if isPaused}
			<span class="paused-indicator">PAUSED</span>
		{/if}
	</div>
</div>

<style>
	.top-bar {
		position: absolute;
		top: 10px;
		left: 10px;
		right: 10px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		pointer-events: none;
	}

	.left-section {
		display: flex;
		gap: 16px;
		background: rgba(0, 0, 0, 0.8);
		padding: 8px 12px;
		border-radius: 4px;
		pointer-events: auto;
	}

	.stat-item {
		display: flex;
		gap: 4px;
		font-family: monospace;
		font-size: 13px;
		color: white;
	}

	.stat-label {
		color: #aaa;
	}

	.stat-value {
		color: #fff;
		font-weight: bold;
	}

	.right-section {
		display: flex;
		gap: 8px;
		align-items: center;
		background: rgba(0, 0, 0, 0.8);
		padding: 8px 12px;
		border-radius: 4px;
		pointer-events: auto;
	}

	.speed-controls {
		display: flex;
		gap: 4px;
	}

	.control-button {
		background: #333;
		color: white;
		border: 1px solid #555;
		padding: 4px 8px;
		border-radius: 4px;
		cursor: pointer;
		font-family: monospace;
		font-size: 12px;
		transition: background 0.15s, border-color 0.15s;
	}

	.control-button:hover {
		background: #444;
		border-color: #666;
	}

	.control-button.active {
		background: #4a90a4;
		border-color: #5ba0b4;
	}

	.pause-button {
		font-size: 14px;
		padding: 4px 10px;
	}

	.paused-indicator {
		font-family: monospace;
		font-size: 12px;
		color: #ff6b6b;
		font-weight: bold;
		margin-left: 4px;
	}

	/* FPS color coding */
	.fps-good {
		color: #90ee90;
	}

	.fps-ok {
		color: #ffd700;
	}

	.fps-bad {
		color: #ff6b6b;
	}
</style>
