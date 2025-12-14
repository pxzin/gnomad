<script lang="ts">
	import type { GameState } from '$lib/game/state';
	import { computeSelectionInfo, getTileTypeName, getGnomeStateName, getIdleBehaviorName, getResourceTypeName } from './types';
	import { ResourceType } from '$lib/components/resource';
	import { TASK_PRIORITY_LABELS, TaskPriority } from '$lib/components/task';
	import { TASK_PRIORITY_COLORS } from '$lib/config/colors';

	interface Props {
		state: GameState;
	}

	let { state }: Props = $props();

	let selectionInfo = $derived(computeSelectionInfo(state));

	// Helper to aggregate inventory items by type
	function aggregateInventory(inventory: { type: ResourceType }[]): Map<ResourceType, number> {
		const counts = new Map<ResourceType, number>();
		for (const item of inventory) {
			counts.set(item.type, (counts.get(item.type) ?? 0) + 1);
		}
		return counts;
	}

	// Helper to convert hex color to CSS
	function hexToCSS(hex: number): string {
		return '#' + hex.toString(16).padStart(6, '0');
	}
</script>

<div class="selection-panel">
	{#if selectionInfo.type === 'none'}
		<div class="no-selection">Nenhuma seleção</div>
	{:else if selectionInfo.type === 'single-tile'}
		<div class="single-tile">
			<div class="info-header" class:bedrock={selectionInfo.tile.isIndestructible}>
				{getTileTypeName(selectionInfo.tile.tileType)}
			</div>
			<div class="info-row">
				<span class="info-label">Position:</span>
				<span class="info-value">({selectionInfo.tile.x}, {selectionInfo.tile.y})</span>
			</div>
			{#if selectionInfo.tile.isIndestructible}
				<div class="info-row">
					<span class="info-label">Durability:</span>
					<span class="info-value indestructible">Indestructible</span>
				</div>
			{:else}
				<div class="info-row">
					<span class="info-label">Durability:</span>
					<span class="info-value">{selectionInfo.tile.durability}/{selectionInfo.tile.maxDurability}</span>
				</div>
			{/if}
			{#if selectionInfo.tile.hasDigTask}
				<div class="info-row task-status">
					<span class="task-badge">Dig Task</span>
					{#if selectionInfo.tile.taskPriority !== null}
						<span
							class="priority-badge"
							style="background-color: {hexToCSS(TASK_PRIORITY_COLORS[selectionInfo.tile.taskPriority])}"
						>
							{TASK_PRIORITY_LABELS[selectionInfo.tile.taskPriority]}
						</span>
					{/if}
				</div>
			{/if}
		</div>
	{:else if selectionInfo.type === 'single-gnome'}
		<div class="single-gnome">
			<div class="info-header">Gnome #{selectionInfo.gnome.entity}</div>
			<div class="info-row">
				<span class="info-label">State:</span>
				<span class="info-value">
					{#if selectionInfo.gnome.idleBehavior}
						{getIdleBehaviorName(selectionInfo.gnome.idleBehavior)}
					{:else}
						{getGnomeStateName(selectionInfo.gnome.state)}
					{/if}
				</span>
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

			<!-- Inventory Section -->
			<div class="inventory-section">
				<div class="inventory-header">
					<span class="info-label">Inventory:</span>
					<span class="inventory-count">{selectionInfo.gnome.inventory.length}/{selectionInfo.gnome.inventoryCapacity}</span>
				</div>
				{#if selectionInfo.gnome.inventory.length > 0}
					{@const inventoryCounts = aggregateInventory(selectionInfo.gnome.inventory)}
					<div class="inventory-items">
						{#each [...inventoryCounts.entries()] as [type, count]}
							<div class="inventory-item">
								<span class="item-type">{getResourceTypeName(type)}</span>
								<span class="item-count">x{count}</span>
							</div>
						{/each}
					</div>
				{:else}
					<div class="inventory-empty">Empty</div>
				{/if}
			</div>
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

	.info-header.bedrock {
		color: #333;
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

	.info-value.indestructible {
		color: #333;
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

	.priority-badge {
		color: white;
		padding: 2px 6px;
		border-radius: 3px;
		font-size: 11px;
		font-weight: bold;
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.5);
	}

	/* Inventory styles */
	.inventory-section {
		margin-top: 8px;
		padding-top: 8px;
		border-top: 1px solid #444;
	}

	.inventory-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 4px;
	}

	.inventory-count {
		font-size: 11px;
		color: #aaa;
	}

	.inventory-items {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.inventory-item {
		display: flex;
		justify-content: space-between;
		padding: 2px 4px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 2px;
	}

	.item-type {
		color: #ddd;
		font-size: 11px;
	}

	.item-count {
		color: #90ee90;
		font-size: 11px;
	}

	.inventory-empty {
		color: #666;
		font-size: 11px;
		font-style: italic;
	}
</style>
