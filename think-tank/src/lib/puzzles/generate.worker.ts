import type { PuzzleRequest } from './generate';
import { generateQueens } from './queens';
import { generateSudoku } from './sudoku';

self.onmessage = ({ data }: MessageEvent<PuzzleRequest>) => {
	self.postMessage(
		data.game === 'sudoku'
			? generateSudoku(data.difficulty)
			: generateQueens(data.size, data.difficulty)
	);
};
