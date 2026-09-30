const MOVES: Record<string, [number, number]> = {
	ArrowUp: [-1, 0],
	ArrowDown: [1, 0],
	ArrowLeft: [0, -1],
	ArrowRight: [0, 1]
};

export function stepFrom(key: string, cell: number, size: number) {
	const move = MOVES[key];
	if (!move) return;
	const row = Math.min(size - 1, Math.max(0, Math.floor(cell / size) + move[0]));
	const column = Math.min(size - 1, Math.max(0, (cell % size) + move[1]));
	return row * size + column;
}
