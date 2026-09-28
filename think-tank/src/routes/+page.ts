import type { BoardVariant } from '$lib/components/AnimatedBoard.svelte';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	const board: BoardVariant = Math.random() < 0.5 ? 'queens' : 'sudoku';
	return { board };
};
