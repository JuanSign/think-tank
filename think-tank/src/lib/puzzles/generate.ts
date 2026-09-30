import type { Difficulty } from './common';
import type { QueensPuzzle } from './queens';
import type { SudokuPuzzle } from './sudoku';

export type PuzzleRequest =
	| { game: 'sudoku'; difficulty: Difficulty }
	| { game: 'queens'; size: number; difficulty: Difficulty };

type PuzzleFor<R extends PuzzleRequest> = R extends { game: 'sudoku' } ? SudokuPuzzle : QueensPuzzle;

let busy: Worker | undefined;

export function generate<R extends PuzzleRequest>(request: R): Promise<PuzzleFor<R>> {
	busy?.terminate();
	const worker = new Worker(new URL('./generate.worker.ts', import.meta.url), { type: 'module' });
	busy = worker;

	return new Promise((resolve, reject) => {
		worker.onmessage = (event: MessageEvent<PuzzleFor<R>>) => {
			worker.terminate();
			resolve(event.data);
		};
		worker.onerror = (event) => {
			worker.terminate();
			reject(new Error(event.message));
		};
		worker.postMessage(request);
	});
}
