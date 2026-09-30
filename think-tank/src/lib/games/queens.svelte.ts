import type { Difficulty } from '$lib/puzzles/common';
import { generate } from '$lib/puzzles/generate';
import { queensHint, type Mark, type QueensHint, type QueensPuzzle } from '$lib/puzzles/queens';
import { Clock } from './clock.svelte';

const NEXT: Record<Mark, Mark> = { empty: 'cross', cross: 'queen', queen: 'empty' };

export class QueensGame {
	size: number;
	clock = new Clock();
	puzzle = $state<QueensPuzzle>();
	marks = $state<Mark[]>([]);
	autoCross = $state(true);
	hint = $state<QueensHint>();
	frame = $state(0);
	loading = $state(false);
	won = $state(false);

	#history = $state<Mark[][]>([]);
	#ticket = 0;
	#stroke: Mark | undefined;

	hintStage = $derived(this.hint?.kind === 'step' ? { at: this.frame + 1, of: 2 } : undefined);
	canUndo = $derived(this.#history.length > 0);
	canClear = $derived(this.marks.some((mark) => mark !== 'empty'));
	playing = $derived(!!this.puzzle && !this.loading && !this.won && !this.clock.paused);
	queens = $derived(this.marks.flatMap((mark, cell) => (mark === 'queen' ? [cell] : [])));
	shown = $derived<Mark[]>(
		this.marks.map((mark, cell) => {
			if (mark === 'queen') return 'queen';
			const covered = this.autoCross && this.queens.some((queen) => this.threatens(queen, cell));
			return mark === 'cross' || covered ? 'cross' : 'empty';
		})
	);
	conflicts = $derived(
		new Set(this.queens.filter((queen) => this.queens.some((other) => this.threatens(queen, other))))
	);

	constructor(size: number) {
		this.size = size;
		this.marks = Array.from({ length: size * size }, () => 'empty');
	}

	async load(difficulty: Difficulty) {
		const ticket = ++this.#ticket;
		this.loading = true;
		this.hint = undefined;
		this.clock.stop();

		const puzzle = await generate({ game: 'queens', size: this.size, difficulty });
		if (ticket !== this.#ticket) return;

		this.puzzle = puzzle;
		this.marks = puzzle.regions.map(() => 'empty');
		this.#history = [];
		this.won = false;
		this.loading = false;
		this.clock.start();
	}

	threatens(a: number, b: number) {
		if (a === b || !this.puzzle) return false;
		const rows = [Math.floor(a / this.size), Math.floor(b / this.size)];
		const columns = [a % this.size, b % this.size];
		return (
			rows[0] === rows[1] ||
			columns[0] === columns[1] ||
			this.puzzle.regions[a] === this.puzzle.regions[b] ||
			(Math.abs(rows[0] - rows[1]) <= 1 && Math.abs(columns[0] - columns[1]) <= 1)
		);
	}

	tap(cell: number) {
		if (!this.playing) return;
		const next = NEXT[this.shown[cell]];
		this.#record();
		this.marks[cell] = next;
		this.#changed();
	}

	startStroke(cell: number) {
		if (!this.playing || this.shown[cell] === 'queen') return false;
		this.#stroke = this.shown[cell] === 'cross' ? 'empty' : 'cross';
		this.#record();
		this.continueStroke(cell);
		return true;
	}

	continueStroke(cell: number) {
		if (!this.#stroke || this.marks[cell] === 'queen') return;
		this.marks[cell] = this.#stroke;
		this.hint = undefined;
	}

	endStroke() {
		this.#stroke = undefined;
	}

	clear() {
		if (!this.playing || !this.canClear) return;
		this.#record();
		this.marks = this.marks.map(() => 'empty');
		this.#changed();
	}

	undo() {
		if (!this.playing) return;
		const last = this.#history.pop();
		if (!last) return;
		this.marks = last;
		this.hint = undefined;
	}

	showHint() {
		if (!this.playing || !this.puzzle) return;
		if (this.hint?.kind === 'step' && this.frame === 0) {
			this.frame = 1;
			return;
		}
		this.frame = 0;
		const own = queensHint(this.puzzle, $state.snapshot(this.marks));
		this.hint = own?.kind === 'mistake' ? own : queensHint(this.puzzle, $state.snapshot(this.shown));
	}

	#record() {
		this.#history.push([...this.marks]);
	}

	#changed() {
		this.hint = undefined;
		if (this.queens.length === this.size && !this.conflicts.size) {
			this.won = true;
			this.clock.stop();
		}
	}
}
