<script lang="ts">
	import PuzzleScreen from '$lib/components/PuzzleScreen.svelte';
	import SudokuBoard from '$lib/components/SudokuBoard.svelte';
	import SudokuControls from '$lib/components/SudokuControls.svelte';
	import { SudokuGame } from '$lib/games/sudoku.svelte';

	const game = new SudokuGame();
</script>

<PuzzleScreen
	title="Sudoku"
	rules="Fill the grid so every row, column and box has the numbers 1 to 9 exactly once."
	{game}
>
	<SudokuBoard {game} />

	{#snippet controls()}
		<SudokuControls {game} />
	{/snippet}
</PuzzleScreen>
