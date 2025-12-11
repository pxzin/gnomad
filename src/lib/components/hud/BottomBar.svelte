<script lang="ts">
	import type { GameState } from '$lib/game/state';
	import type { Command } from '$lib/game/commands';
	import SelectionPanel from './SelectionPanel.svelte';
	import ActionBar from './ActionBar.svelte';

	interface Props {
		state: GameState;
		onCommand: (command: Command) => void;
	}

	let { state, onCommand }: Props = $props();
</script>

<div class="bottom-bar">
	<div class="left-section">
		<SelectionPanel {state} />
	</div>
	<div class="right-section">
		<ActionBar {state} {onCommand} />
	</div>
</div>

<style>
	.bottom-bar {
		position: absolute;
		bottom: 10px;
		left: 10px;
		right: 10px;
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		pointer-events: none;
	}

	.left-section {
		pointer-events: auto;
	}

	.right-section {
		pointer-events: auto;
	}
</style>
