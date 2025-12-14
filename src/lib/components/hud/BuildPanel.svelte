<script lang="ts">
	import type { GameState } from '$lib/game/state';
	import type { Command } from '$lib/game/commands';
	import { placeBuilding } from '$lib/game/commands';
	import { BuildingType } from '$lib/components/building';

	interface Props {
		state: GameState;
		buildMode: BuildingType | null;
		onCommand: (command: Command) => void;
		onSetBuildMode: (mode: BuildingType | null) => void;
	}

	let { state, buildMode, onCommand, onSetBuildMode }: Props = $props();

	function toggleBuildMode() {
		if (buildMode === BuildingType.Storage) {
			onSetBuildMode(null);
		} else {
			onSetBuildMode(BuildingType.Storage);
		}
	}

	let isActive = $derived(buildMode === BuildingType.Storage);
</script>

<div class="build-panel">
	<div class="panel-header">Build</div>
	<button
		class="build-button"
		class:active={isActive}
		onclick={toggleBuildMode}
		title="Place Storage building (B)"
	>
		<span class="build-icon storage"></span>
		<span class="build-label">Storage</span>
	</button>
	{#if isActive}
		<div class="build-hint">Click to place</div>
	{/if}
</div>

<style>
	.build-panel {
		background: rgba(0, 0, 0, 0.8);
		padding: 8px 12px;
		border-radius: 4px;
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 100px;
	}

	.panel-header {
		font-family: monospace;
		font-size: 11px;
		color: #888;
		text-transform: uppercase;
		letter-spacing: 1px;
	}

	.build-button {
		background: #333;
		color: white;
		border: 1px solid #555;
		padding: 8px 12px;
		border-radius: 4px;
		cursor: pointer;
		font-family: monospace;
		font-size: 12px;
		display: flex;
		align-items: center;
		gap: 8px;
		transition: background 0.15s, border-color 0.15s;
	}

	.build-button:hover {
		background: #444;
		border-color: #666;
	}

	.build-button.active {
		background: #4a6fa5;
		border-color: #5a7fb5;
	}

	.build-icon {
		width: 16px;
		height: 16px;
		border-radius: 2px;
	}

	.build-icon.storage {
		background-color: #4a6fa5;
	}

	.build-label {
		flex: 1;
	}

	.build-hint {
		font-family: monospace;
		font-size: 10px;
		color: #4a6fa5;
		text-align: center;
	}
</style>
