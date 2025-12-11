<script lang="ts">
	import type { GameState } from '$lib/game/state';
	import { computeSelectionInfo, getTileTypeName, getGnomeStateName } from './types';

	interface Props {
		state: GameState;
	}

	let { state }: Props = $props();

	let selectionInfo = $derived(computeSelectionInfo(state));
</script>

<div class="selection-panel">
	{#if selectionInfo.type === 'none'}
		<div class="no-selection">Nenhuma seleção</div>
	{:else if selectionInfo.type === 'single-tile'}
		<div class="single-tile">
			<div class="info-header">{getTileTypeName(selectionInfo.tile.tileType)}</div>
			<div class="info-row">
				<span class="info-label">Position:</span>
				<span class="info-value">({selectionInfo.tile.x}, {selectionInfo.tile.y})</span>
			</div>
			<div class="info-row">
				<span class="info-label">Durability:</span>
				<span class="info-value">{selectionInfo.tile.durability}/{selectionInfo.tile.maxDurability}</span>
			</div>
			{#if selectionInfo.tile.hasDigTask}
				<div class="info-row task-status">
					<span class="task-badge">Dig Task</span>
				</div>
			{/if}
		</div>
	{:else if selectionInfo.type === 'single-gnome'}
		<div class="single-gnome">
			<div class="info-header">Gnome #{selectionInfo.gnome.entity}</div>
			<div class="info-row">
				<span class="info-label">State:</span>
				<span class="info-value">{getGnomeStateName(selectionInfo.gnome.state)}</span>
			</div>
			<div class="info-row">
				<span class="info-label">Position:</span>
				<span class="info-value">({selectionInfo.gnome.position.x}, {selectionInfo.gnome.position.y})</span>
			</div>
			{#if selectionInfo.gnome.currentTask}
				<div class="info-row">
					<span class="info-label">Task:</span>
					<span class="info-value">{selectionInfo.gnome.currentTask}</span>
				</div>
			{:else}
				<div class="info-row">
					<span class="info-label">Task:</span>
					<span class="info-value idle">Idle</span>
				</div>
			{/if}
		</div>
	{:else if selectionInfo.type === 'multiple'}
		<div class="multiple-selection">
			<div class="info-header">Multiple Selection</div>
			{#if selectionInfo.tileCount > 0}
				<div class="info-row">
					<span class="info-label">Tiles:</span>
					<span class="info-value">{selectionInfo.tileCount}</span>
				</div>
			{/if}
			{#if selectionInfo.gnomeCount > 0}
				<div class="info-row">
					<span class="info-label">Gnomes:</span>
					<span class="info-value">{selectionInfo.gnomeCount}</span>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.selection-panel {
		background: rgba(0, 0, 0, 0.8);
		padding: 10px 14px;
		border-radius: 4px;
		min-width: 180px;
		font-family: monospace;
		font-size: 12px;
		color: white;
	}

	.no-selection {
		color: #888;
		font-style: italic;
	}

	.info-header {
		font-weight: bold;
		font-size: 13px;
		margin-bottom: 8px;
		color: #4a90a4;
	}

	.info-row {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 4px;
	}

	.info-label {
		color: #aaa;
	}

	.info-value {
		color: #fff;
	}

	.info-value.idle {
		color: #888;
		font-style: italic;
	}

	.task-status {
		margin-top: 4px;
	}

	.task-badge {
		background: #4a9a4a;
		color: white;
		padding: 2px 6px;
		border-radius: 3px;
		font-size: 11px;
	}
</style>
