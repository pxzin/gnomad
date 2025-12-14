<script lang="ts">
	import type { ResourceInventory } from './types';

	interface Props {
		inventory: ResourceInventory;
	}

	let { inventory }: Props = $props();
</script>

<div class="resource-panel">
	<div class="resource-item">
		<span class="resource-icon dirt"></span>
		<span class="resource-count">{inventory.dirt}</span>
	</div>
	<div class="resource-item">
		<span class="resource-icon stone"></span>
		<span class="resource-count">{inventory.stone}</span>
	</div>
</div>

<style>
	.resource-panel {
		display: flex;
		gap: 12px;
		background: rgba(0, 0, 0, 0.8);
		padding: 8px 12px;
		border-radius: 4px;
		pointer-events: auto;
	}

	.resource-item {
		display: flex;
		align-items: center;
		gap: 6px;
		font-family: monospace;
		font-size: 13px;
		color: white;
	}

	.resource-icon {
		width: 12px;
		height: 12px;
		border-radius: 2px;
	}

	.resource-icon.dirt {
		background-color: #8b4513;
	}

	.resource-icon.stone {
		background-color: #808080;
	}

	.resource-count {
		font-weight: bold;
		min-width: 24px;
	}
</style>
