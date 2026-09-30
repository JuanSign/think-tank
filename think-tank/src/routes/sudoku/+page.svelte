<script lang="ts">
	import { untrack } from 'svelte';
	import PuzzleScreen from '$lib/components/PuzzleScreen.svelte';
	import SudokuBoard from '$lib/components/SudokuBoard.svelte';
	import SudokuControls from '$lib/components/SudokuControls.svelte';
	import { SudokuGame } from '$lib/games/sudoku.svelte';
	import type { Difficulty } from '$lib/puzzles/common';

	let difficulty = $state<Difficulty>('medium');

	const game = new SudokuGame();

	$effect(() => {
		const level = difficulty;
		untrack(() => game.load(level));
	});
</script>

<PuzzleScreen
	title="Sudoku"
	bind:difficulty
	rules="Fill the grid so every row, column and box has the numbers 1 to 9 exactly once."
	clock={game.clock}
	won={game.won}
	loading={game.loading}
	onnewpuzzle={() => game.load(difficulty)}
>
	<SudokuBoard {game} />

	{#snippet controls()}
		<SudokuControls {game} />
	{/snippet}
</PuzzleScreen>
