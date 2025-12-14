<script lang="ts">
	import Game from '$lib/components/Game.svelte';
</script>

<svelte:head>
	<title>Gnomes At Work</title>
</svelte:head>

<main>
	<Game
		worldConfig={{
			width: 100,
			height: 50,
			seed: 12345
		}}
	/>
</main>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}

	main {
		width: 100vw;
		height: 100vh;
	}
</style>
