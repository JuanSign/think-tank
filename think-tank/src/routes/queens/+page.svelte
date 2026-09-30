<script lang="ts">
	import PuzzleScreen from '$lib/components/PuzzleScreen.svelte';
	import QueensBoard from '$lib/components/QueensBoard.svelte';
	import QueensControls from '$lib/components/QueensControls.svelte';
	import { QueensGame } from '$lib/games/queens.svelte';

	const game = new QueensGame(7);
</script>

<PuzzleScreen
	title="Queens"
	rules="Place one queen in each row, column and colored region. No two queens can touch."
	{game}
>
	<QueensBoard {game} />

	{#snippet controls()}
		<QueensControls {game} />
	{/snippet}
</PuzzleScreen>
