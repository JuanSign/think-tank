import type { Difficulty } from '$lib/puzzles/common';
import { generate } from '$lib/puzzles/generate';
import { sudokuHint, type SudokuHint, type SudokuPuzzle } from '$lib/puzzles/sudoku';
import { Clock } from './clock.svelte';

type Snapshot = { values: number[]; notes: number[] };

const CELLS = Array.from({ length: 81 }, (_, i) => i);

export const rowOf = (cell: number) => Math.floor(cell / 9);
export const colOf = (cell: number) => cell % 9;
export const boxOf = (cell: number) =>
	Math.floor(rowOf(cell) / 3) * 3 + Math.floor(colOf(cell) / 3);

export const sees = (a: number, b: number) =>
	a !== b && (rowOf(a) === rowOf(b) || colOf(a) === colOf(b) || boxOf(a) === boxOf(b));

export class SudokuGame {
	clock = new Clock();
	puzzle = $state<SudokuPuzzle>();
	values = $state(CELLS.map(() => 0));
	notes = $state(CELLS.map(() => 0));
	selected = $state(-1);
	noting = $state(false);
	hint = $state<SudokuHint>();
	frame = $state(0);
	loading = $state(false);
	won = $state(false);

	#history = $state<Snapshot[]>([]);
	#ticket = 0;

	hintStage = $derived.by(() => {
		const hint = this.hint;
		if (hint?.kind !== 'steps' || !hint.steps.length) return;
		const of = hint.steps.length + 1;
		return { at: Math.min(this.frame + 1, of), of };
	});
	canUndo = $derived(this.#history.length > 0);
	playing = $derived(!!this.puzzle && !this.loading && !this.won && !this.clock.paused);
	conflicts = $derived(
		new Set(
			CELLS.filter(
				(cell) =>
					this.values[cell] &&
					CELLS.some((other) => sees(cell, other) && this.values[other] === this.values[cell])
			)
		)
	);

	async load(difficulty: Difficulty) {
		const ticket = ++this.#ticket;
		this.loading = true;
		this.hint = undefined;
		this.clock.stop();

		const puzzle = await generate({ game: 'sudoku', difficulty });
		if (ticket !== this.#ticket) return;

		this.puzzle = puzzle;
		this.values = [...puzzle.givens];
		this.notes = CELLS.map(() => 0);
		this.#history = [];
		this.selected = puzzle.givens.indexOf(0);
		this.noting = false;
		this.won = false;
		this.loading = false;
		this.clock.start();
	}

	given(cell: number) {
		return !!this.puzzle?.givens[cell];
	}

	select(cell: number) {
		if (cell !== this.selected) this.hint = undefined;
		this.selected = cell;
	}

	enter(digit: number) {
		const cell = this.selected;
		if (!this.playing || this.given(cell)) return;

		if (this.noting) {
			if (this.values[cell]) return;
			this.#record();
			this.notes[cell] ^= 1 << digit;
		} else {
			this.#record();
			this.values[cell] = this.values[cell] === digit ? 0 : digit;
			if (this.values[cell]) {
				for (const other of CELLS) if (sees(cell, other)) this.notes[other] &= ~(1 << digit);
			}
		}
		this.#changed();
	}

	erase() {
		const cell = this.selected;
		if (!this.playing || this.given(cell)) return;
		if (!this.values[cell] && !this.notes[cell]) return;
		this.#record();
		this.values[cell] = 0;
		this.notes[cell] = 0;
		this.#changed();
	}

	undo() {
		if (!this.playing) return;
		const last = this.#history.pop();
		if (!last) return;
		this.values = last.values;
		this.notes = last.notes;
		this.hint = undefined;
	}

	showHint() {
		if (!this.playing || !this.puzzle) return;
		if (this.hint?.kind === 'steps' && this.frame < this.hint.steps.length) {
			this.frame++;
		} else {
			this.hint = sudokuHint($state.snapshot(this.values), this.puzzle.solution);
			this.frame = 0;
		}

		const hint = this.hint;
		if (hint?.kind === 'mistake') this.selected = hint.cells[0];
		if (hint?.kind === 'steps' && this.frame >= hint.steps.length - 1) {
			this.selected = hint.steps.at(-1)?.place?.cell ?? this.selected;
		}
	}

	#record() {
		this.#history.push({ values: [...this.values], notes: [...this.notes] });
	}

	#changed() {
		this.hint = undefined;
		const solution = this.puzzle?.solution;
		if (solution && this.values.every((value, cell) => value === solution[cell])) {
			this.won = true;
			this.clock.stop();
		}
	}
}
