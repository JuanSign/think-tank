<script lang="ts">
	import { tick } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fade, scale } from 'svelte/transition';
	import { DIFFICULTIES, type Difficulty } from '$lib/puzzles/common';
	import Icon from './Icon.svelte';

	const LABELS: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

	let { value = $bindable() }: { value: Difficulty } = $props();

	const id = $props.id();
	let open = $state(false);
	let root: HTMLElement;
	let trigger: HTMLButtonElement;
	const items: HTMLButtonElement[] = $state([]);

	async function show() {
		open = true;
		await tick();
		items[DIFFICULTIES.indexOf(value)].focus();
	}

	function hide(refocus: boolean) {
		open = false;
		if (refocus) trigger.focus();
	}

	function choose(level: Difficulty) {
		value = level;
		hide(true);
	}

	function onTriggerKey(event: KeyboardEvent) {
		if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
		event.preventDefault();
		show();
	}

	function onMenuKey(event: KeyboardEvent) {
		const current = items.indexOf(document.activeElement as HTMLButtonElement);
		const last = items.length - 1;
		const moves: Record<string, number> = {
			ArrowDown: current === last ? 0 : current + 1,
			ArrowUp: current <= 0 ? last : current - 1,
			Home: 0,
			End: last
		};
		if (event.key in moves) {
			event.preventDefault();
			items[moves[event.key]].focus();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			hide(true);
		} else if (event.key === 'Tab') {
			hide(false);
		}
	}

	function onWindowPointer(event: PointerEvent) {
		if (open && !root.contains(event.target as Node)) hide(false);
	}
</script>

<svelte:window onpointerdown={onWindowPointer} />

<div class="level-menu" bind:this={root}>
	<button
		bind:this={trigger}
		type="button"
		class="trigger"
		aria-haspopup="menu"
		aria-expanded={open}
		aria-controls={open ? id : undefined}
		onclick={() => (open ? hide(true) : show())}
		onkeydown={onTriggerKey}
	>
		<span class="visually-hidden">Difficulty:</span>
		{LABELS[value]}
		<Icon name="chevron" />
	</button>

	{#if open}
		<div
			{id}
			class="menu"
			role="menu"
			aria-label="Difficulty"
			tabindex="-1"
			onkeydown={onMenuKey}
			in:scale={{ start: 0.96, duration: 160, easing: cubicOut }}
			out:fade={{ duration: 100 }}
		>
			{#each DIFFICULTIES as level, i (level)}
				<button
					bind:this={items[i]}
					type="button"
					class="item"
					role="menuitemradio"
					aria-checked={level === value}
					tabindex="-1"
					onclick={() => choose(level)}
				>
					{LABELS[level]}
					{#if level === value}
						<Icon name="check" />
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.level-menu {
		position: relative;
	}

	.trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		min-height: 2.75rem;
		margin-left: -0.2rem;
		padding: 0 0.35rem 0 0.55rem;
		border: 0;
		border-radius: var(--radius-m);
		background: none;
		color: var(--ink-soft);
		font-size: var(--step--1);
		font-weight: 500;
		cursor: pointer;
		transition:
			background-color 160ms,
			color 160ms;
	}

	.trigger:hover,
	.trigger[aria-expanded='true'] {
		background: var(--surface);
		color: var(--ink);
	}

	.trigger :global(svg) {
		width: 1rem;
		height: 1rem;
		transition: rotate 200ms var(--ease-out);
	}

	.trigger[aria-expanded='true'] :global(svg) {
		rotate: 180deg;
	}

	.menu {
		position: absolute;
		top: calc(100% + 0.25rem);
		left: 50%;
		z-index: 1;
		display: grid;
		min-width: 9rem;
		padding: 0.3rem;
		border-radius: var(--radius-m);
		background: var(--surface);
		box-shadow:
			0 0 0 1px var(--line),
			0 12px 32px -12px rgb(8 20 40 / 0.35);
		transform-origin: top center;
		translate: -50% 0;
	}

	.item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		min-height: 2.75rem;
		padding: 0 0.75rem;
		border: 0;
		border-radius: var(--radius-s);
		background: none;
		color: var(--ink);
		font-size: var(--step--1);
		font-weight: 500;
		text-align: left;
		cursor: pointer;
		transition:
			background-color 160ms,
			color 160ms;
	}

	.item:hover,
	.item:focus-visible {
		background: var(--accent-soft);
	}

	.item:focus-visible {
		outline-offset: -3px;
	}

	.item[aria-checked='true'] {
		color: var(--accent);
		font-weight: 600;
	}

	.item :global(svg) {
		width: 1.1rem;
		height: 1.1rem;
	}
</style>
