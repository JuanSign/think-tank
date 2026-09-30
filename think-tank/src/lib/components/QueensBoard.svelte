<script lang="ts">
	import { stepFrom } from '$lib/games/grid';
	import { paintRegions } from '$lib/games/queens-colors';
	import type { QueensGame } from '$lib/games/queens.svelte';
	import { joins } from '$lib/games/regions';
	import BoardFrame from './BoardFrame.svelte';
	import Crown from './Crown.svelte';

	const SEED_SIZE = 4;

	let { game }: { game: QueensGame } = $props();

	let grid: HTMLElement;
	let focused = $state(0);
	let press: { start: number; last: number; pointer: number; dragging: boolean } | undefined;
	let swallowClick = false;

	let size = $derived(game.size);
	let seedStart = $derived(Math.floor((size - SEED_SIZE) / 2));
	let cells = $derived(
		Array.from({ length: size * size }, (_, i) => {
			const row = Math.floor(i / size);
			const col = i % size;
			const dx = side(col);
			const dy = side(row);
			return { row, col, dx, dy, inSeed: dx === 0 && dy === 0 };
		})
	);

	let regions = $derived(game.puzzle?.regions);
	let paint = $derived(regions ? paintRegions(size, regions) : []);

	let step = $derived(game.hint?.kind === 'step' ? game.hint.step : undefined);
	let answered = $derived(game.frame > 0);
	let supposing = $derived(step?.suppose !== undefined && !answered);
	let reason = $derived(new Set(step?.cells));
	let action = $derived(
		new Set(step ? (step.place !== undefined ? [step.place] : step.eliminate) : [])
	);
	let targets = $derived(supposing ? new Set<number>() : action);
	let knocked = $derived(new Set(supposing ? step?.knocked : []));
	let mistakes = $derived(new Set(game.hint?.kind === 'mistake' ? game.hint.cells : []));

	function side(index: number) {
		if (index < seedStart) return -1;
		if (index >= seedStart + SEED_SIZE) return 1;
		return 0;
	}

	function label(cell: { row: number; col: number }, i: number) {
		const mark = { empty: 'empty', cross: 'crossed out', queen: 'queen' }[game.shown[i]];
		return `Row ${cell.row + 1}, column ${cell.col + 1}: ${mark}`;
	}

	function cellAt(x: number, y: number) {
		const cell = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-cell]');
		return cell && grid.contains(cell) ? Number(cell.dataset.cell) : undefined;
	}

	function onpointerdown(event: PointerEvent, cell: number) {
		swallowClick = false;
		if (event.button !== 0) return;
		press = { start: cell, last: cell, pointer: event.pointerId, dragging: false };
	}

	function onpointermove(event: PointerEvent) {
		if (!press || event.pointerId !== press.pointer) return;
		const cell = cellAt(event.clientX, event.clientY);
		if (cell === undefined || cell === press.last) return;
		if (!press.dragging) {
			press.dragging = game.startStroke(press.start);
			if (!press.dragging) return void (press = undefined);
		}
		game.continueStroke(cell);
		press.last = cell;
	}

	function onpointerup() {
		if (press?.dragging) {
			game.endStroke();
			swallowClick = true;
		}
		press = undefined;
	}

	function onclick(event: MouseEvent, cell: number) {
		if (swallowClick && event.detail > 0) return void (swallowClick = false);
		focused = cell;
		game.tap(cell);
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.defaultPrevented || event.altKey) return;
		if (event.ctrlKey || event.metaKey) {
			if (event.key.toLowerCase() !== 'z') return;
			event.preventDefault();
			game.undo();
			return;
		}
		if (!grid.contains(document.activeElement)) return;
		const next = stepFrom(event.key, focused, size);
		if (next === undefined) return;
		event.preventDefault();
		focused = next;
		grid.querySelector<HTMLElement>(`[data-cell="${next}"]`)?.focus();
	}
</script>

<svelte:window {onkeydown} {onpointermove} {onpointerup} onpointercancel={onpointerup} />

<BoardFrame label="Queens board">
	<div class="cell-grid" style:--n={size} bind:this={grid}>
		{#each cells as cell, i (i)}
			{@const mark = game.shown[i]}
			<button
				type="button"
				class={[
					'cell',
					regions && joins(size, regions, i),
					{
						pattern: reason.has(i) && !supposing,
						squeezed: reason.has(i) && supposing,
						suppose: supposing && step?.suppose === i,
						target: targets.has(i),
						conflict: game.conflicts.has(i),
						mistake: mistakes.has(i)
					}
				]}
				style:grid-area="{cell.row + 1} / {cell.col + 1}"
				style:--fill={regions ? `var(--queens-${paint[regions[i]] + 1})` : undefined}
				data-side={cell.inSeed ? undefined : ''}
				data-dx={cell.dx}
				data-dy={cell.dy}
				data-cell={i}
				data-piece={regions?.[i]}
				tabindex={i === focused ? 0 : -1}
				aria-label={label(cell, i)}
				onpointerdown={(event) => onpointerdown(event, i)}
				onclick={(event) => onclick(event, i)}
			>
				<span class="line" aria-hidden="true"></span>
				{#if mark === 'queen'}
					<svg class="queen" viewBox="0 0 24 24" aria-hidden="true"><Crown /></svg>
				{:else if supposing && step?.suppose === i}
					<svg class="queen ghost what-if" viewBox="0 0 24 24" aria-hidden="true"><Crown /></svg>
				{:else if answered && step?.place === i}
					<svg class="queen ghost" viewBox="0 0 24 24" aria-hidden="true"><Crown /></svg>
				{:else if mark === 'cross'}
					<span class="cross" aria-hidden="true">×</span>
				{:else if answered && action.has(i)}
					<span class="cross ghost" aria-hidden="true">×</span>
				{:else if knocked.has(i)}
					<span class="cross knocked" aria-hidden="true">×</span>
				{/if}
			</button>
		{/each}
		<span
			class="seed"
			data-seed
			style:grid-area="{seedStart + 1} / {seedStart + 1} / span {SEED_SIZE} / span {SEED_SIZE}"
		></span>
	</div>
</BoardFrame>

<style>
	.cell-grid {
		--gap: calc(var(--cell) * var(--gap-ratio));
		--corner-radius: calc(var(--cell) * var(--radius-ratio));
		--bend-radius: calc(var(--corner-radius) + var(--gap));
		--spread: calc((var(--gap) + 1px) * var(--merge));
		--flat: calc(var(--corner-radius) * (1 - var(--merge)));
		--hollow: calc(var(--bend-radius) * (1.4143 - 0.4143 * var(--merge)));
		--divider: color-mix(in srgb, var(--paper-deep) 70%, transparent);

		touch-action: none;
		user-select: none;
		-webkit-touch-callout: none;
	}

	.cell-grid > .cell {
		--color: color-mix(
			in srgb,
			var(--fill, var(--surface)) calc(var(--paint) * 100%),
			var(--surface)
		);
		--scoop: transparent calc(var(--hollow) - 0.5px), var(--color) calc(var(--hollow) + 0.5px);
		--tile: calc(var(--bend-radius) + 1px);

		position: relative;
		display: grid;
		place-items: center;
		padding: 0;
		border: 0;
		background: var(--color);
		box-shadow:
			var(--east, 0 0 transparent),
			var(--south, 0 0 transparent),
			var(--corner, 0 0 transparent);
		color: var(--ink);
		cursor: pointer;
		-webkit-tap-highlight-color: transparent;
	}

	.cell::after {
		content: '';
		position: absolute;
		inset: calc(var(--bend-radius) * -1);
		background:
			var(--bend-nw, none),
			var(--bend-ne, none),
			var(--bend-sw, none),
			var(--bend-se, none);
		pointer-events: none;
	}

	.east {
		--east: var(--spread) 0 var(--color);
	}

	.south {
		--south: 0 var(--spread) var(--color);
	}

	.corner {
		--corner: var(--spread) var(--spread) var(--color);
	}

	.flat-nw {
		border-top-left-radius: var(--flat);
	}

	.flat-ne {
		border-top-right-radius: var(--flat);
	}

	.flat-sw {
		border-bottom-left-radius: var(--flat);
	}

	.flat-se {
		border-bottom-right-radius: var(--flat);
	}

	.bend-nw {
		--bend-nw: radial-gradient(circle at 0 0, var(--scoop)) left top / var(--tile) var(--tile)
			no-repeat;
	}

	.bend-ne {
		--bend-ne: radial-gradient(circle at 100% 0, var(--scoop)) right top / var(--tile) var(--tile)
			no-repeat;
	}

	.bend-sw {
		--bend-sw: radial-gradient(circle at 0 100%, var(--scoop)) left bottom / var(--tile)
			var(--tile) no-repeat;
	}

	.bend-se {
		--bend-se: radial-gradient(circle at 100% 100%, var(--scoop)) right bottom / var(--tile)
			var(--tile) no-repeat;
	}

	.line {
		position: absolute;
		z-index: 1;
		inset: 0;
		border: 0 solid var(--divider);
		opacity: calc(var(--merge) * 2 - 1);
		pointer-events: none;
	}

	.line-n .line {
		top: calc(var(--gap) / -2);
	}

	.line-e .line {
		right: calc(var(--gap) / -2);
	}

	.line-s .line {
		bottom: calc(var(--gap) / -2);
	}

	.line-w .line {
		left: calc(var(--gap) / -2);
	}

	.east .line {
		border-right-width: 1px;
	}

	.south .line {
		border-bottom-width: 1px;
	}

	.cell:focus-visible {
		z-index: 2;
		outline-offset: 1px;
	}

	.queen {
		width: 56%;
		fill: var(--queen);
	}

	.cross {
		font-size: calc(var(--cell) * 0.5);
		line-height: 1;
		opacity: 0.75;
	}

	.ghost {
		animation: glow 1.1s ease-in-out infinite;
	}

	.target::before,
	.pattern::before,
	.squeezed::before,
	.suppose::before,
	.conflict::before,
	.mistake::before {
		content: '';
		position: absolute;
		inset: var(--gap);
		border: 0 solid transparent;
		border-radius: var(--corner-radius);
		pointer-events: none;
	}

	.target::before {
		background: var(--hint);
		opacity: 0.4;
		animation: beckon 0.9s ease-in-out 4;
	}

	.pattern::before {
		border-width: 3px;
		border-color: var(--hint);
	}

	.queen,
	.cross {
		position: relative;
		filter: opacity(var(--paint));
	}

	.squeezed::before,
	.suppose::before {
		border-width: 3px;
		border-color: var(--danger);
	}

	.what-if {
		fill: var(--danger);
	}

	.cross.knocked {
		color: var(--danger);
		opacity: 1;
	}

	.conflict::before {
		border-width: 2px;
		border-color: var(--danger);
	}

	.conflict .queen {
		fill: var(--danger);
	}

	.mistake::before {
		border-width: 3px;
		border-color: var(--danger);
		animation: alarm 0.45s ease-in-out 4;
	}

	.seed {
		aspect-ratio: auto;
		pointer-events: none;
	}

	@keyframes glow {
		0%,
		100% {
			opacity: 0.8;
		}
		50% {
			opacity: 0.15;
		}
	}

	@keyframes beckon {
		50% {
			opacity: 0.05;
		}
	}

	@keyframes alarm {
		50% {
			border-color: transparent;
		}
	}
</style>
