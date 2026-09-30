import { describeLines, pick, rank, shuffle, DIFFICULTIES, type Difficulty } from './common';

export type QueensPuzzle = {
	size: number;
	regions: number[];
	solution: number[];
	difficulty: Difficulty;
};

export type Mark = 'empty' | 'cross' | 'queen';

export type QueensStep = {
	technique: string;
	message: string;
	cells: number[];
	place?: number;
	eliminate: number[];
	suppose?: number;
	knocked?: number[];
};

export type QueensHint =
	| { kind: 'mistake'; cells: number[]; message: string }
	| { kind: 'step'; step: QueensStep };

type Family = 'row' | 'column' | 'region';
type Unit = { kind: Family; index: number; cells: number[] };
type Grid = {
	cells: number[];
	rows: Unit[];
	columns: Unit[];
	unitOf: { row: number[]; column: number[] };
	lines: number[][];
	groups: number[][];
};
type Board = {
	size: number;
	units: Record<Family, Unit[]>;
	unitOf: Record<Family, number[]>;
	attacks: Set<number>[];
	groups: number[][];
	open: boolean[];
	queens: boolean[];
};
type Technique = { tier: Difficulty; find: (board: Board) => QueensStep | undefined };

const MAX_ATTEMPTS = 60;
const MAX_TWEAKS = 200;
const FAMILIES: Family[] = ['row', 'column', 'region'];
const PAIRINGS = FAMILIES.flatMap((inner) =>
	FAMILIES.filter((outer) => outer !== inner).map((outer) => [inner, outer] as const)
);
const grids = new Map<number, Grid>();

const TECHNIQUES: Technique[] = [
	{ tier: 'easy', find: lastCell },
	{ tier: 'easy', find: (board) => confinement(board, 1) },
	{ tier: 'easy', find: sharedAttack },
	{ tier: 'medium', find: groupConfinement },
	{ tier: 'hard', find: contradiction }
];

export function generateQueens(size: number, difficulty: Difficulty): QueensPuzzle {
	let fallback: QueensPuzzle | undefined;
	for (let attempt = 1; ; attempt++) {
		const solution = placeQueens(size);
		let regions = growRegions(size, solution);
		let current = judge(size, regions, difficulty);
		for (let i = 0; i < MAX_TWEAKS && current.grade !== difficulty; i++) {
			const tweaked = tweak(size, regions, solution, current.open);
			if (!tweaked) break;
			const next = judge(size, tweaked, difficulty);
			if (next.grade && (!fallback || rank(next.grade) > rank(fallback.difficulty))) {
				fallback = { size, regions: tweaked, solution, difficulty: next.grade };
			}
			if (next.score < current.score) continue;
			regions = tweaked;
			current = next;
		}

		if (current.grade === difficulty) return { size, regions, solution, difficulty };
		if (fallback && attempt >= MAX_ATTEMPTS) return fallback;
	}
}

export function queensHint(puzzle: QueensPuzzle, marks: Mark[]): QueensHint | undefined {
	const { size, solution } = puzzle;
	const needsQueen = (cell: number) => solution[Math.floor(cell / size)] === cell % size;
	const wrong = marks.flatMap((mark, cell) =>
		(mark === 'queen' && !needsQueen(cell)) || (mark === 'cross' && needsQueen(cell)) ? [cell] : []
	);
	if (wrong.length) {
		const message =
			wrong.length > 1
				? "These marks aren't right."
				: marks[wrong[0]] === 'queen'
					? "This queen isn't in the right spot."
					: 'This cell is crossed out, but a queen belongs here.';
		return { kind: 'mistake', cells: wrong, message };
	}

	const board = boardFor(size, puzzle.regions);
	marks.forEach((mark, cell) => {
		if (mark === 'queen') placeQueen(board, cell);
		if (mark === 'cross') board.open[cell] = false;
	});
	if (solved(board)) return;

	for (const queen of marks.flatMap((mark, cell) => (mark === 'queen' ? [cell] : []))) {
		const unmarked = [...board.attacks[queen]].filter((cell) => marks[cell] === 'empty');
		if (!unmarked.length) continue;
		return {
			kind: 'step',
			step: {
				technique: 'Queen reach',
				message: 'A queen rules out its row, its column, its region and every cell touching it.',
				cells: [queen],
				eliminate: unmarked
			}
		};
	}

	const found = nextStep(board, TECHNIQUES);
	if (found) return { kind: 'step', step: found.step };

	const row = board.units.row.findIndex((unit) => !hasQueen(board, unit));
	const cell = row * size + solution[row];
	const reveal = { technique: 'Reveal', message: 'A queen belongs here.', cells: [cell] };
	return { kind: 'step', step: { ...reveal, place: cell, eliminate: [] } };
}

function judge(size: number, regions: number[], difficulty: Difficulty) {
	const result = solve(boardFor(size, regions), difficulty);
	if (!result.solved) return { score: result.progress, open: result.open };
	const cells = size * size;
	const level = rank(difficulty);
	const early = (tier: number) => cells - result.reached[Math.max(tier, 0)];
	const score = cells + 1 + early(level) * (cells + 1) + early(level - 1);
	return { grade: result.hardest, score, open: result.open };
}

function placeQueens(size: number) {
	const columns: number[] = [];
	const place = (row: number): boolean => {
		if (row === size) return true;
		for (const column of shuffle(Array.from({ length: size }, (_, i) => i))) {
			if (columns.includes(column)) continue;
			if (row > 0 && Math.abs(column - columns[row - 1]) < 2) continue;
			columns.push(column);
			if (place(row + 1)) return true;
			columns.pop();
		}
		return false;
	};
	place(0);
	return columns;
}

function growRegions(size: number, solution: number[]) {
	const regions = Array.from({ length: size * size }, () => -1);
	const ids = shuffle(solution.map((_, row) => row));
	solution.forEach((column, row) => (regions[row * size + column] = ids[row]));

	for (let left = size * size - size; left > 0; left--) {
		const edges = regions.flatMap((region, cell) =>
			region < 0
				? []
				: neighbours(size, cell)
						.filter((next) => regions[next] < 0)
						.map((next) => ({ next, region }))
		);
		const region = pick([...new Set(edges.map((edge) => edge.region))]);
		regions[pick(edges.filter((edge) => edge.region === region)).next] = region;
	}
	return regions;
}

function tweak(size: number, regions: number[], solution: number[], open: boolean[]) {
	const areas = solution.map((_, region) => regions.filter((id) => id === region).length);
	const moves = regions.flatMap((region, cell) =>
		solution[Math.floor(cell / size)] === cell % size || areas[region] <= 2
			? []
			: neighbours(size, cell)
					.filter((next) => regions[next] !== region && areas[regions[next]] < 2 * size)
					.map((next) => ({ cell, region: regions[next] }))
	);
	const undecided = moves.filter((move) => open[move.cell]);
	for (const { cell, region } of shuffle(undecided.length ? undecided : moves)) {
		const tweaked = [...regions];
		tweaked[cell] = region;
		if (connected(size, tweaked, regions[cell])) return tweaked;
	}
}

function connected(size: number, regions: number[], region: number) {
	const cells = regions.flatMap((id, cell) => (id === region ? [cell] : []));
	const seen = new Set(cells.slice(0, 1));
	for (const cell of seen) {
		for (const next of neighbours(size, cell)) {
			if (regions[next] === region) seen.add(next);
		}
	}
	return seen.size === cells.length;
}

function neighbours(size: number, cell: number) {
	const row = Math.floor(cell / size);
	const column = cell % size;
	return [
		row > 0 && cell - size,
		row < size - 1 && cell + size,
		column > 0 && cell - 1,
		column < size - 1 && cell + 1
	].filter((next) => next !== false);
}

function solve(board: Board, upTo: Difficulty) {
	const allowed = TECHNIQUES.filter((technique) => rank(technique.tier) <= rank(upTo));
	const closed = () => board.open.filter((open) => !open).length;
	const reached: number[] = [];
	let hardest = 0;
	while (!solved(board)) {
		const found = nextStep(board, allowed);
		if (!found) break;
		for (let tier = 0; tier <= rank(found.tier); tier++) reached[tier] ??= closed();
		apply(board, found.step);
		hardest = Math.max(hardest, rank(found.tier));
	}
	const progress = closed();
	return {
		solved: solved(board),
		hardest: DIFFICULTIES[hardest],
		progress,
		reached: DIFFICULTIES.map((_, tier) => reached[tier] ?? progress),
		open: board.open
	};
}

function nextStep(board: Board, techniques: Technique[]) {
	for (const { tier, find } of techniques) {
		const step = find(board);
		if (step) return { step, tier };
	}
}

function boardFor(size: number, regions: number[]): Board {
	const { cells, rows, columns, unitOf, lines, groups } = gridOf(size);
	const areas = unitsBy('region', regions, size);
	const attacks = cells.map((cell) => {
		const attacked = new Set([...lines[cell], ...areas[regions[cell]].cells]);
		attacked.delete(cell);
		return attacked;
	});
	return {
		size,
		units: { row: rows, column: columns, region: areas },
		unitOf: { ...unitOf, region: regions },
		attacks,
		groups,
		open: cells.map(() => true),
		queens: cells.map(() => false)
	};
}

function gridOf(size: number): Grid {
	const cached = grids.get(size);
	if (cached) return cached;
	const cells = Array.from({ length: size * size }, (_, i) => i);
	const row = cells.map((cell) => Math.floor(cell / size));
	const column = cells.map((cell) => cell % size);
	const masks = Array.from({ length: 1 << size }, (_, mask) => mask);
	const grid = {
		cells,
		rows: unitsBy('row', row, size),
		columns: unitsBy('column', column, size),
		unitOf: { row, column },
		lines: cells.map((cell) =>
			cells.filter(
				(other) =>
					row[other] === row[cell] ||
					column[other] === column[cell] ||
					(Math.abs(row[other] - row[cell]) <= 1 && Math.abs(column[other] - column[cell]) <= 1)
			)
		),
		groups: Array.from({ length: size + 1 }, (_, count) =>
			masks.filter((mask) => countBits(mask) === count)
		)
	};
	grids.set(size, grid);
	return grid;
}

function unitsBy(kind: Family, indexOf: number[], size: number): Unit[] {
	return Array.from({ length: size }, (_, index) => ({
		kind,
		index,
		cells: indexOf.flatMap((at, cell) => (at === index ? [cell] : []))
	}));
}

function placeQueen(board: Board, cell: number) {
	board.queens[cell] = true;
	board.open[cell] = false;
	for (const other of board.attacks[cell]) board.open[other] = false;
}

function apply(board: Board, step: QueensStep) {
	if (step.place !== undefined) placeQueen(board, step.place);
	for (const cell of step.eliminate) board.open[cell] = false;
}

const solved = (board: Board) => board.queens.filter(Boolean).length === board.size;
const hasQueen = (board: Board, unit: Unit) => unit.cells.some((cell) => board.queens[cell]);
const openIn = (board: Board, unit: Unit) => unit.cells.filter((cell) => board.open[cell]);
const capitalize = (text: string) => text[0].toUpperCase() + text.slice(1);

function bitsOf(mask: number) {
	const bits: number[] = [];
	for (let i = 0; mask >> i; i++) if ((mask >> i) & 1) bits.push(i);
	return bits;
}

function countBits(mask: number) {
	let count = 0;
	for (; mask; mask &= mask - 1) count++;
	return count;
}

function describe(kind: Family, indices: number[]) {
	if (kind !== 'region') return describeLines(kind, indices);
	return indices.length === 1 ? 'this region' : `these ${indices.length} regions`;
}

function spread(board: Board, inner: Family, outer: Family) {
	const reach = board.units[inner].map(() => 0);
	let waiting = (1 << board.size) - 1;
	board.open.forEach((open, cell) => {
		if (open) reach[board.unitOf[inner][cell]] |= 1 << board.unitOf[outer][cell];
		if (board.queens[cell]) waiting &= ~(1 << board.unitOf[inner][cell]);
	});
	return { reach, waiting };
}

function reachOf(reach: number[], group: number) {
	let mask = 0;
	for (let i = 0; group >> i; i++) if ((group >> i) & 1) mask |= reach[i];
	return mask;
}

function lastCell(board: Board): QueensStep | undefined {
	for (const kind of FAMILIES) {
		for (const unit of board.units[kind]) {
			const open = openIn(board, unit);
			if (open.length !== 1 || hasQueen(board, unit)) continue;
			const [cell] = open;
			return {
				technique: 'Last cell',
				message: `${capitalize(describe(kind, [unit.index]))} has one open cell left, so its queen goes here.`,
				cells: unit.cells,
				place: cell,
				eliminate: [...board.attacks[cell]].filter((other) => board.open[other])
			};
		}
	}
}

function confinement(board: Board, size: number): QueensStep | undefined {
	for (const [inner, outer] of PAIRINGS) {
		const { reach, waiting } = spread(board, inner, outer);
		const back = spread(board, outer, inner).reach;
		for (const group of board.groups[size]) {
			if ((group & waiting) !== group) continue;
			const covered = reachOf(reach, group);
			if (countBits(covered) !== size) continue;
			if (!(reachOf(back, covered) & ~group)) continue;
			const eliminate = board.open.flatMap((open, cell) =>
				open &&
				covered & (1 << board.unitOf[outer][cell]) &&
				!(group & (1 << board.unitOf[inner][cell]))
					? [cell]
					: []
			);
			if (!eliminate.length) continue;
			const units = bitsOf(group).map((index) => board.units[inner][index]);
			const those = describe(inner, bitsOf(group));
			const room = describe(outer, bitsOf(covered));
			const consequence =
				size === 1
					? `${capitalize(those)}'s queen will land there, so nothing else in ${room} can hold a queen.`
					: `Their ${size} queens will fill ${room}, so nothing else there can hold a queen.`;
			return {
				technique: 'Confinement',
				message: `Every open cell in ${those} is inside ${room}. ${consequence}`,
				cells: units.flatMap((unit) => openIn(board, unit)),
				eliminate
			};
		}
	}
}

function groupConfinement(board: Board) {
	for (let size = 2; size <= board.size / 2; size++) {
		const step = confinement(board, size);
		if (step) return step;
	}
}

function sharedAttack(board: Board): QueensStep | undefined {
	for (const kind of FAMILIES) {
		for (const unit of board.units[kind]) {
			const open = openIn(board, unit);
			if (!open.length) continue;
			const eliminate = [...board.attacks[open[0]]].filter(
				(cell) => board.open[cell] && open.every((spot) => board.attacks[spot].has(cell))
			);
			if (!eliminate.length) continue;
			const those = describe(kind, [unit.index]);
			return {
				technique: 'Shared attack',
				message: `Wherever ${those}'s queen goes, it rules out ${eliminate.length === 1 ? 'this cell' : 'these cells'}.`,
				cells: open,
				eliminate
			};
		}
	}
}

function contradiction(board: Board): QueensStep | undefined {
	for (const cell of board.open.flatMap((open, cell) => (open ? [cell] : []))) {
		const trial = { ...board, open: [...board.open], queens: [...board.queens] };
		placeQueen(trial, cell);
		for (const [inner, outer] of PAIRINGS) {
			const { reach, waiting } = spread(trial, inner, outer);
			for (const pair of board.groups[2]) {
				if ((pair & waiting) !== pair) continue;
				const covered = reachOf(reach, pair);
				if (countBits(covered) > 1) continue;
				const units = bitsOf(pair).map((index) => board.units[inner][index]);
				return {
					technique: 'Contradiction',
					message: `A queen here would squeeze ${describe(inner, bitsOf(pair))} into ${describe(outer, bitsOf(covered))}, with no room for 2 queens. So this cell is ruled out.`,
					cells: units.flatMap((unit) => openIn(trial, unit)),
					eliminate: [cell],
					suppose: cell,
					knocked: units.flatMap((unit) =>
						unit.cells.filter((other) => board.open[other] && !trial.open[other])
					)
				};
			}
		}
	}
}
