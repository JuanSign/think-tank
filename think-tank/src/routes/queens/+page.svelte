<script lang="ts">
	import { untrack } from 'svelte';
	import PuzzleScreen from '$lib/components/PuzzleScreen.svelte';
	import QueensBoard from '$lib/components/QueensBoard.svelte';
	import QueensControls from '$lib/components/QueensControls.svelte';
	import { QueensGame } from '$lib/games/queens.svelte';
	import type { Difficulty } from '$lib/puzzles/common';

	let difficulty = $state<Difficulty>('medium');

	const game = new QueensGame(7);

	$effect(() => {
		const level = difficulty;
		untrack(() => game.load(level));
	});
</script>

<PuzzleScreen
	title="Queens"
	bind:difficulty
	rules="Place one queen in each row, column and colored region. No two queens can touch."
	clock={game.clock}
	won={game.won}
	loading={game.loading}
	onnewpuzzle={() => game.load(difficulty)}
>
	<QueensBoard {game} />

	{#snippet controls()}
		<QueensControls {game} />
	{/snippet}
</PuzzleScreen>
