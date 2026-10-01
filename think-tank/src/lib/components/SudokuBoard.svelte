<script lang="ts">
	import { stepFrom } from '$lib/games/grid';
	import { colOf, rowOf, sees, type SudokuGame } from '$lib/games/sudoku.svelte';
	import type { Candidate } from '$lib/puzzles/sudoku';
	import BoardFrame from './BoardFrame.svelte';

	let { game }: { game: SudokuGame } = $props();

	const nine = Array.from({ length: 9 }, (_, i) => i);
	const DIGITS = nine.map((i) => i + 1);
	const CENTER = 4;
	const CHUNKS = [
		[1, 2],
		[2, 1],
		[1, 3],
		[3, 1],
		[2, 2]
	];

	let grid: HTMLElement;

	const cellAt = (box: number, spot: number) =>
		(Math.floor(box / 3) * 3 + Math.floor(spot / 3)) * 9 + (box % 3) * 3 + (spot % 3);

	let chunks = $derived(game.puzzle ? carve() : []);

	let steps = $derived(game.hint?.kind === 'steps' ? game.hint.steps : []);
	let current = $derived(steps[Math.min(game.frame, steps.length - 1)]);
	let revealed = $derived(steps.length > 0 && game.frame >= steps.length);
	let area = $derived(new Set(current?.cells));
	let clues = $derived(new Set(current?.clues));
	let answer = $derived(current?.place);
	let marks = $derived(masksOf(current?.marks ?? []));
	let struck = $derived(masksOf(steps.slice(0, game.frame + 1).flatMap((step) => step.eliminate)));
	let fresh = $derived(masksOf(current?.eliminate ?? []));
	let mistakes = $derived(new Set(game.hint?.kind === 'mistake' ? game.hint.cells : []));
	let chosen = $derived(game.values[game.selected]);

	function carve() {
		const chunkOf: number[] = [];
		let next = 0;
		for (const box of nine) {
			const taken = new Set<number>();
			for (const spot of nine) {
				if (taken.has(spot)) continue;
				const fits = CHUNKS.map(([rows, cols]) => spotsFrom(spot, rows, cols)).filter(
					(spots) => spots.length > 0 && spots.every((covered) => !taken.has(covered))
				);
				const chosen = fits.length ? fits[Math.floor(Math.random() * fits.length)] : [spot];
				for (const covered of chosen) {
					taken.add(covered);
					chunkOf[cellAt(box, covered)] = next;
				}
				next++;
			}
		}
		return chunkOf;
	}

	function spotsFrom(spot: number, rows: number, cols: number) {
		const row = Math.floor(spot / 3);
		const col = spot % 3;
		if (row + rows > 3 || col + cols > 3) return [];
		return Array.from(
			{ length: rows * cols },
			(_, i) => (row + Math.floor(i / cols)) * 3 + col + (i % cols)
		);
	}

	function masksOf(candidates: Candidate[]) {
		const masks = new Map<number, number>();
		for (const { cell, digit } of candidates) masks.set(cell, (masks.get(cell) ?? 0) | (1 << digit));
		return masks;
	}

	function label(cell: number) {
		const value = game.values[cell];
		const place = `Row ${rowOf(cell) + 1}, column ${colOf(cell) + 1}`;
		return `${place}: ${value || 'empty'}${game.given(cell) ? ', given' : ''}`;
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.defaultPrevented || event.altKey) return;
		if (event.ctrlKey || event.metaKey) {
			if (event.key.toLowerCase() !== 'z') return;
			event.preventDefault();
			game.undo();
			return;
		}

		if (/^[1-9]$/.test(event.key)) game.enter(Number(event.key));
		else if (['Backspace', 'Delete', '0'].includes(event.key)) game.erase();
		else if (event.key.toLowerCase() === 'n') game.noting = !game.noting;
		else {
			const next = stepFrom(event.key, game.selected, 9);
			if (next === undefined) return;
			game.select(next);
			if (grid.contains(document.activeElement)) {
				grid.querySelector<HTMLElement>(`[data-cell="${next}"]`)?.focus();
			}
		}
		event.preventDefault();
	}
</script>

<svelte:window {onkeydown} />

<BoardFrame label="Sudoku board">
	<div class="boxes" bind:this={grid}>
		{#each nine as box (box)}
			<div
				class="box"
				data-seed={box === CENTER ? '' : undefined}
				data-side={box === CENTER ? undefined : ''}
				data-dx={(box % 3) - 1}
				data-dy={Math.floor(box / 3) - 1}
			>
				<div class="cell-grid" style:--n={3}>
					{#each nine as spot (spot)}
						{@const cell = cellAt(box, spot)}
						{@const value = game.values[cell]}
						<button
							type="button"
							class={[
								'cell',
								{
									given: game.given(cell),
									peer: sees(cell, game.selected),
									same: !!value && value === chosen,
									conflict: game.conflicts.has(cell),
									area: area.has(cell),
									clue: clues.has(cell),
									selected: cell === game.selected,
									target: cell === answer?.cell,
									mistake: mistakes.has(cell)
								}
							]}
							data-cell={cell}
							data-piece={chunks[cell]}
							tabindex={cell === game.selected ? 0 : -1}
							aria-label={label(cell)}
							onclick={() => game.select(cell)}
						>
							{#if value}
								<span>{value}</span>
							{:else if revealed && cell === answer?.cell}
								<span class="ghost" aria-hidden="true">{answer.digit}</span>
							{:else if game.notes[cell] && !marks.has(cell) && !struck.has(cell)}
								<span class="notes" aria-hidden="true">
									{#each DIGITS as digit (digit)}
										<span>{game.notes[cell] & (1 << digit) ? digit : ''}</span>
									{/each}
								</span>
							{/if}
							{#if !value && (marks.has(cell) || struck.has(cell))}
								<span class="notes pencil" aria-hidden="true">
									{#each DIGITS as digit (digit)}
										{@const bit = 1 << digit}
										{#if (struck.get(cell) ?? 0) & bit}
											<span class="struck" class:old={!((fresh.get(cell) ?? 0) & bit)}>{digit}</span>
										{:else if (marks.get(cell) ?? 0) & bit}
											<span class="mark">{digit}</span>
										{:else}
											<span></span>
										{/if}
									{/each}
								</span>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		{/each}
	</div>
</BoardFrame>

<style>
	.boxes {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1.2cqi;
		border-radius: 2cqi;
		background: color-mix(
			in srgb,
			var(--grid-line) calc(var(--merge) * var(--assembled, 1) * 100%),
			transparent
		);
	}

	.box {
		container-type: inline-size;
	}

	.box > .cell-grid {
		--divider: var(--grid-line);

		gap: calc(var(--cell) * var(--gap-ratio) * (1 - var(--merge)));
	}

	.cell {
		--corner-radius: calc(var(--cell) * var(--radius-ratio));

		position: relative;
		display: grid;
		place-items: center;
		padding: 0;
		border: 0 solid color-mix(in srgb, var(--divider) calc(var(--merge) * 100%), transparent);
		border-radius: calc(var(--corner-radius) * (1 - var(--merge)));
		color: var(--accent);
		font-size: calc(var(--cell) * 0.58);
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		line-height: 1;
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
		transition:
			background-color 120ms,
			box-shadow 120ms;
	}

	.cell:nth-child(3n + 1),
	.cell:nth-child(3n + 2) {
		border-right-width: 1px;
	}

	.cell:nth-child(-n + 6) {
		border-bottom-width: 1px;
	}

	.box:nth-child(1) .cell:nth-child(1) {
		border-top-left-radius: var(--corner-radius);
	}

	.box:nth-child(3) .cell:nth-child(3) {
		border-top-right-radius: var(--corner-radius);
	}

	.box:nth-child(7) .cell:nth-child(7) {
		border-bottom-left-radius: var(--corner-radius);
	}

	.box:nth-child(9) .cell:nth-child(9) {
		border-bottom-right-radius: var(--corner-radius);
	}

	.cell > * {
		opacity: var(--paint);
	}

	.cell:focus-visible {
		z-index: 1;
		outline-offset: 1px;
	}

	.given {
		color: var(--ink);
		font-weight: 700;
	}

	.cell.peer {
		background: color-mix(in srgb, var(--accent) calc(var(--paint) * var(--highlight-peer)), var(--surface));
	}

	.cell.same {
		background: color-mix(in srgb, var(--accent) calc(var(--paint) * var(--highlight-same)), var(--surface));
	}

	.cell.area {
		background: color-mix(in srgb, var(--hint) 20%, var(--surface));
	}

	.cell.clue {
		box-shadow: inset 0 0 0 2px var(--hint);
	}

	.cell.selected {
		background: color-mix(in srgb, var(--accent) calc(var(--paint) * var(--highlight-selected)), var(--surface));
		box-shadow: inset 0 0 0 2px
			color-mix(in srgb, var(--accent) calc(var(--paint) * 100%), transparent);
	}

	.cell.target {
		background: color-mix(in srgb, var(--hint) 32%, var(--surface));
		box-shadow: inset 0 0 0 3px var(--hint);
		animation: beckon 0.9s ease-in-out 4;
	}

	.conflict {
		color: var(--danger);
	}

	.cell.mistake {
		background: color-mix(in srgb, var(--danger) 16%, var(--surface));
		box-shadow: inset 0 0 0 2px var(--danger);
		color: var(--danger);
		animation: alarm 0.45s ease-in-out 4;
	}

	.ghost {
		color: var(--hint);
		animation: glow 1.1s ease-in-out infinite;
	}

	.notes.pencil {
		position: absolute;
		inset: 0;
		font-size: calc(var(--cell) * 0.26);
		font-weight: 700;
	}

	.pencil .mark,
	.pencil .struck {
		place-self: center;
		width: 1.35em;
		height: 1.35em;
		border-radius: 999px;
	}

	.pencil .mark {
		background: color-mix(in srgb, var(--hint) 22%, transparent);
		color: var(--hint);
	}

	.pencil .struck {
		background: color-mix(in srgb, var(--danger) 22%, transparent);
		color: var(--danger);
	}

	.pencil .struck.old {
		opacity: 0.45;
	}

	@keyframes beckon {
		50% {
			background: color-mix(in srgb, var(--hint) 6%, var(--surface));
			box-shadow: inset 0 0 0 3px transparent;
		}
	}

	@keyframes alarm {
		50% {
			background: color-mix(in srgb, var(--danger) 45%, var(--surface));
		}
	}

	@keyframes glow {
		50% {
			opacity: 0.2;
		}
	}

	.notes {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		width: 100%;
		height: 100%;
		padding: 8%;
		color: var(--ink-soft);
		font-size: calc(var(--cell) * 0.22);
		font-weight: 500;
	}

	.notes span {
		display: grid;
		place-items: center;
	}
</style>
