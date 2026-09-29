<script lang="ts">
	import PuzzleScreen from '$lib/components/PuzzleScreen.svelte';
	import SudokuBoard from '$lib/components/SudokuBoard.svelte';
	import SudokuControls from '$lib/components/SudokuControls.svelte';
</script>

<PuzzleScreen
	title="Sudoku"
	level="Medium"
	rules="Fill the grid so every row, column and box has the numbers 1 to 9 exactly once."
>
	<SudokuBoard />

	{#snippet controls()}
		<SudokuControls />
	{/snippet}
</PuzzleScreen>
