<script lang="ts">
	import type { GameState } from '$lib/game/state';
	import type { Command } from '$lib/game/commands';
	import TopBar from './TopBar.svelte';
	import BottomBar from './BottomBar.svelte';

	interface Props {
		state: GameState;
		fps: number;
		onCommand: (command: Command) => void;
	}

	let { state, fps, onCommand }: Props = $props();
</script>

<div class="hud-overlay">
	<TopBar {state} {fps} {onCommand} />
	<BottomBar {state} {onCommand} />
</div>

<style>
	.hud-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		pointer-events: none;
		z-index: 100;
	}
</style>
