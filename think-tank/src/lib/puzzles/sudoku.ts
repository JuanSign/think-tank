import {
	combinations,
	describeLines,
	joinAnd,
	rank,
	shuffle,
	DIFFICULTIES,
	type Difficulty
} from './common';

export type SudokuPuzzle = {
	givens: number[];
	solution: number[];
	difficulty: Difficulty;
};

export type Candidate = { cell: number; digit: number };

export type SudokuStep = {
	technique: string;
	message: string;
	cells: number[];
	clues?: number[];
	marks?: Candidate[];
	requires: Candidate[];
	place?: Candidate;
	eliminate: Candidate[];
};

export type SudokuHint =
	| { kind: 'mistake'; cells: number[]; message: string }
	| { kind: 'steps'; steps: SudokuStep[] };

type Unit = { kind: 'row' | 'column' | 'box'; index: number; cells: number[] };
type Board = { grid: number[]; cands: number[] };
type Technique = { tier: Difficulty; find: (board: Board) => SudokuStep | undefined };

const CLUE_FLOOR: Record<Difficulty, number> = { easy: 36, medium: 0, hard: 0 };
const MAX_ATTEMPTS = 100;

const ALL = 0b1111111110;
const CELLS = Array.from({ length: 81 }, (_, i) => i);
const NINE = Array.from({ length: 9 }, (_, i) => i);
const DIGITS = NINE.map((i) => i + 1);

const rowOf = (cell: number) => Math.floor(cell / 9);
const colOf = (cell: number) => cell % 9;
const boxOf = (cell: number) => Math.floor(rowOf(cell) / 3) * 3 + Math.floor(colOf(cell) / 3);

const unitsBy = (kind: Unit['kind'], indexOf: (cell: number) => number): Unit[] =>
	NINE.map((index) => ({ kind, index, cells: CELLS.filter((cell) => indexOf(cell) === index) }));

const ROWS = unitsBy('row', rowOf);
const COLUMNS = unitsBy('column', colOf);
const BOXES = unitsBy('box', boxOf);
const UNITS = [...BOXES, ...ROWS, ...COLUMNS];
const PEERS = CELLS.map((cell) =>
	[
		...new Set([
			...ROWS[rowOf(cell)].cells,
			...COLUMNS[colOf(cell)].cells,
			...BOXES[boxOf(cell)].cells
		])
	].filter((peer) => peer !== cell)
);
const PEER_SETS = PEERS.map((peers) => new Set(peers));
const OVERLAPS = UNITS.flatMap((a) =>
	UNITS.filter(
		(b) => (a.kind === 'box') !== (b.kind === 'box') && a.cells.some((cell) => b.cells.includes(cell))
	).map((b) => [a, b] as const)
);

const bit = (digit: number) => 1 << digit;
const digitsIn = (mask: number) => DIGITS.filter((digit) => mask & bit(digit));
const countOf = (mask: number) => digitsIn(mask).length;
const name = (unit: Unit) => (unit.kind === 'box' ? 'this box' : `${unit.kind} ${unit.index + 1}`);

const TECHNIQUES: Technique[] = [
	{ tier: 'easy', find: hiddenSingle },
	{ tier: 'easy', find: nakedSingle },
	{ tier: 'medium', find: lockedCandidates },
	{ tier: 'medium', find: (board) => nakedSubset(board, 2) },
	{ tier: 'medium', find: (board) => hiddenSubset(board, 2) },
	{ tier: 'medium', find: (board) => nakedSubset(board, 3) },
	{ tier: 'medium', find: (board) => hiddenSubset(board, 3) },
	{ tier: 'hard', find: (board) => fish(board, 2) },
	{ tier: 'hard', find: xyWing },
	{ tier: 'hard', find: (board) => fish(board, 3) }
];

export function generateSudoku(difficulty: Difficulty): SudokuPuzzle {
	let best = attempt(difficulty);
	for (let i = 1; i < MAX_ATTEMPTS && best.difficulty !== difficulty; i++) {
		const next = attempt(difficulty);
		if (rank(next.difficulty) > rank(best.difficulty)) best = next;
	}
	return best;
}

export function sudokuHint(grid: number[], solution: number[]): SudokuHint | undefined {
	const wrong = CELLS.filter((cell) => grid[cell] && grid[cell] !== solution[cell]);
	if (wrong.length) {
		const message =
			wrong.length === 1 ? "This number doesn't belong here." : "These numbers don't belong here.";
		return { kind: 'mistake', cells: wrong, message };
	}

	const board = boardFrom(grid);
	const steps: SudokuStep[] = [];
	for (let found = nextStep(board, TECHNIQUES); found; found = nextStep(board, TECHNIQUES)) {
		steps.push(found.step);
		if (found.step.place) return { kind: 'steps', steps: trim(steps) };
		apply(board, found.step);
	}

	const cell = CELLS.find((cell) => !grid[cell]);
	if (cell === undefined) return;
	const digit = solution[cell];
	const reveal = { technique: 'Reveal', message: `This cell is ${digit}.`, cells: [cell] };
	return {
		kind: 'steps',
		steps: [{ ...reveal, place: { cell, digit }, requires: [], eliminate: [] }]
	};
}

function trim(steps: SudokuStep[]) {
	const key = ({ cell, digit }: Candidate) => cell * 10 + digit;
	const needed = new Set<number>();
	const kept: SudokuStep[] = [];
	for (const step of [...steps].reverse()) {
		if (kept.length && !step.eliminate.some((candidate) => needed.has(key(candidate)))) continue;
		kept.unshift(step);
		for (const candidate of step.requires) needed.add(key(candidate));
	}
	return kept;
}

function attempt(difficulty: Difficulty): SudokuPuzzle {
	const solution = fullGrid();
	const givens = dig(solution, difficulty);
	return { givens, solution, difficulty: solve(givens, difficulty).hardest };
}

function fullGrid() {
	const grid = CELLS.map(() => 0);
	const fill = (cell: number): boolean => {
		if (cell === 81) return true;
		const used = PEERS[cell].reduce((mask, peer) => mask | bit(grid[peer]), 0);
		for (const digit of shuffle(digitsIn(ALL & ~used))) {
			grid[cell] = digit;
			if (fill(cell + 1)) return true;
		}
		grid[cell] = 0;
		return false;
	};
	fill(0);
	return grid;
}

function dig(solution: number[], difficulty: Difficulty) {
	const givens = [...solution];
	let clues = 81;
	for (const cell of shuffle(CELLS.slice(0, 41))) {
		const pair = [...new Set([cell, 80 - cell])];
		if (clues - pair.length < CLUE_FLOOR[difficulty]) continue;
		pair.forEach((c) => (givens[c] = 0));
		if (solve(givens, difficulty).solved) clues -= pair.length;
		else pair.forEach((c) => (givens[c] = solution[c]));
	}
	return givens;
}

function solve(grid: number[], upTo: Difficulty) {
	const board = boardFrom(grid);
	const allowed = TECHNIQUES.filter((technique) => rank(technique.tier) <= rank(upTo));
	let hardest = 0;
	while (board.grid.includes(0)) {
		const found = nextStep(board, allowed);
		if (!found) return { solved: false, hardest: DIFFICULTIES[hardest] };
		apply(board, found.step);
		hardest = Math.max(hardest, rank(found.tier));
	}
	return { solved: true, hardest: DIFFICULTIES[hardest] };
}

function nextStep(board: Board, techniques: Technique[]) {
	for (const { tier, find } of techniques) {
		const step = find(board);
		if (step) return { step, tier };
	}
}

function boardFrom(grid: number[]): Board {
	const cands = grid.map((value, cell) =>
		value ? 0 : PEERS[cell].reduce((mask, peer) => mask & ~bit(grid[peer]), ALL)
	);
	return { grid: [...grid], cands };
}

function apply({ grid, cands }: Board, step: SudokuStep) {
	if (step.place) {
		const { cell, digit } = step.place;
		grid[cell] = digit;
		cands[cell] = 0;
		for (const peer of PEERS[cell]) cands[peer] &= ~bit(digit);
	}
	for (const { cell, digit } of step.eliminate) cands[cell] &= ~bit(digit);
}

function hiddenSingle({ grid, cands }: Board): SudokuStep | undefined {
	for (const unit of UNITS) {
		for (const digit of DIGITS) {
			const spots = unit.cells.filter((cell) => cands[cell] & bit(digit));
			if (spots.length !== 1) continue;
			const blocked = unit.cells.filter((cell) => !grid[cell] && cell !== spots[0]);
			return {
				technique: 'Hidden single',
				message: `${digit} has only one spot left in ${name(unit)}.`,
				cells: unit.cells,
				clues: CELLS.filter(
					(cell) => grid[cell] === digit && blocked.some((spot) => PEER_SETS[spot].has(cell))
				),
				requires: blocked.map((cell) => ({ cell, digit })),
				place: { cell: spots[0], digit },
				eliminate: []
			};
		}
	}
}

function nakedSingle({ cands }: Board): SudokuStep | undefined {
	const cell = CELLS.find((cell) => countOf(cands[cell]) === 1);
	if (cell === undefined) return;
	const digit = digitsIn(cands[cell])[0];
	return {
		technique: 'Naked single',
		message: `${digit} is the only number this cell can still hold.`,
		cells: [cell, ...PEERS[cell]],
		requires: DIGITS.filter((other) => other !== digit).map((other) => ({ cell, digit: other })),
		place: { cell, digit },
		eliminate: []
	};
}

function lockedCandidates({ grid, cands }: Board): SudokuStep | undefined {
	for (const [a, b] of OVERLAPS) {
		for (const digit of DIGITS) {
			const spots = a.cells.filter((cell) => cands[cell] & bit(digit));
			if (spots.length < 2 || !spots.every((cell) => b.cells.includes(cell))) continue;
			const eliminate = b.cells
				.filter((cell) => !a.cells.includes(cell) && cands[cell] & bit(digit))
				.map((cell) => ({ cell, digit }));
			if (!eliminate.length) continue;
			return {
				technique: 'Locked candidates',
				message: `In ${name(a)}, ${digit} can only go where it overlaps ${name(b)}. So ${digit} can't go anywhere else in ${name(b)}.`,
				cells: a.cells,
				marks: spots.map((cell) => ({ cell, digit })),
				requires: a.cells
					.filter((cell) => !grid[cell] && !b.cells.includes(cell))
					.map((cell) => ({ cell, digit })),
				eliminate
			};
		}
	}
}

function nakedSubset({ cands }: Board, size: number): SudokuStep | undefined {
	for (const unit of UNITS) {
		const open = unit.cells.filter((cell) => cands[cell] && countOf(cands[cell]) <= size);
		for (const group of combinations(open, size)) {
			const mask = group.reduce((union, cell) => union | cands[cell], 0);
			if (countOf(mask) !== size) continue;
			const eliminate = unit.cells
				.filter((cell) => !group.includes(cell))
				.flatMap((cell) => digitsIn(cands[cell] & mask).map((digit) => ({ cell, digit })));
			if (!eliminate.length) continue;
			return {
				technique: size === 2 ? 'Naked pair' : 'Naked triple',
				message: `These ${size} cells in ${name(unit)} can only hold ${joinAnd(digitsIn(mask))}, so those numbers can't go anywhere else in ${name(unit)}.`,
				cells: unit.cells,
				marks: group.flatMap((cell) => digitsIn(cands[cell]).map((digit) => ({ cell, digit }))),
				requires: group.flatMap((cell) =>
					digitsIn(ALL & ~mask).map((digit) => ({ cell, digit }))
				),
				eliminate
			};
		}
	}
}

function hiddenSubset({ grid, cands }: Board, size: number): SudokuStep | undefined {
	for (const unit of UNITS) {
		const spotsOf = (digit: number) => unit.cells.filter((cell) => cands[cell] & bit(digit));
		const digits = DIGITS.filter((digit) => {
			const spots = spotsOf(digit).length;
			return spots >= 2 && spots <= size;
		});
		for (const group of combinations(digits, size)) {
			const cells = [...new Set(group.flatMap(spotsOf))];
			if (cells.length !== size) continue;
			const mask = group.reduce((union, digit) => union | bit(digit), 0);
			const eliminate = cells.flatMap((cell) =>
				digitsIn(cands[cell] & ~mask).map((digit) => ({ cell, digit }))
			);
			if (!eliminate.length) continue;
			return {
				technique: size === 2 ? 'Hidden pair' : 'Hidden triple',
				message: `In ${name(unit)}, ${joinAnd(group)} can only go in these ${size} cells, so those cells can't hold anything else.`,
				cells: unit.cells,
				marks: cells.flatMap((cell) =>
					digitsIn(cands[cell] & mask).map((digit) => ({ cell, digit }))
				),
				requires: unit.cells
					.filter((cell) => !grid[cell] && !cells.includes(cell))
					.flatMap((cell) => group.map((digit) => ({ cell, digit }))),
				eliminate
			};
		}
	}
}

function fish({ grid, cands }: Board, size: number): SudokuStep | undefined {
	const orientations = [
		[ROWS, COLUMNS, colOf],
		[COLUMNS, ROWS, rowOf]
	] as const;
	for (const [bases, covers, coverOf] of orientations) {
		for (const digit of DIGITS) {
			const spotsIn = (line: Unit) => line.cells.filter((cell) => cands[cell] & bit(digit));
			const lines = bases.filter((line) => {
				const spots = spotsIn(line).length;
				return spots >= 2 && spots <= size;
			});
			for (const group of combinations(lines, size)) {
				const spots = group.flatMap(spotsIn);
				const covered = [...new Set(spots.map(coverOf))];
				if (covered.length !== size) continue;
				const eliminate = covered
					.flatMap((index) => covers[index].cells)
					.filter((cell) => !spots.includes(cell) && cands[cell] & bit(digit))
					.map((cell) => ({ cell, digit }));
				if (!eliminate.length) continue;
				const baseLines = describeLines(bases[0].kind, group.map((line) => line.index));
				const coverLines = describeLines(covers[0].kind, covered);
				const lineCells = group.flatMap((line) => line.cells);
				return {
					technique: size === 2 ? 'X-Wing' : 'Swordfish',
					message: `In ${baseLines}, ${digit} can only go in ${coverLines}. Those ${digit}s will fill ${coverLines}, so no other cell there can be ${digit}.`,
					cells: lineCells,
					marks: spots.map((cell) => ({ cell, digit })),
					requires: lineCells
						.filter((cell) => !grid[cell] && !covered.includes(coverOf(cell)))
						.map((cell) => ({ cell, digit })),
					eliminate
				};
			}
		}
	}
}

function xyWing({ cands }: Board): SudokuStep | undefined {
	const pairs = CELLS.filter((cell) => countOf(cands[cell]) === 2);
	for (const pivot of pairs) {
		const wings = pairs.filter(
			(cell) => PEER_SETS[pivot].has(cell) && countOf(cands[cell] & cands[pivot]) === 1
		);
		for (const [a, b] of combinations(wings, 2)) {
			const shared = cands[a] & cands[b];
			if (countOf(shared) !== 1 || shared & cands[pivot]) continue;
			const digit = digitsIn(shared)[0];
			const eliminate = PEERS[a]
				.filter((cell) => PEER_SETS[b].has(cell) && cands[cell] & shared)
				.map((cell) => ({ cell, digit }));
			if (!eliminate.length) continue;
			const [x, y] = digitsIn(cands[pivot]);
			return {
				technique: 'XY-Wing',
				message: `One highlighted cell can only be ${x} or ${y}, and it sees the other two. Whichever it is, one of those two becomes ${digit}, so any cell that sees both of them can't be ${digit}.`,
				cells: [pivot, a, b],
				marks: [pivot, a, b].flatMap((cell) =>
					digitsIn(cands[cell]).map((digit) => ({ cell, digit }))
				),
				requires: [pivot, a, b].flatMap((cell) =>
					digitsIn(ALL & ~cands[cell]).map((digit) => ({ cell, digit }))
				),
				eliminate
			};
		}
	}
}
