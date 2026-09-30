<script lang="ts">
	import Icon, { type IconName } from './Icon.svelte';

	let {
		icon,
		label,
		pressed,
		badge,
		beckon = false,
		disabled = false,
		onclick
	}: {
		icon: IconName;
		label: string;
		pressed?: boolean;
		badge?: string;
		beckon?: boolean;
		disabled?: boolean;
		onclick?: () => void;
	} = $props();

	let tag = $derived(badge ?? (pressed === undefined ? undefined : pressed ? 'On' : 'Off'));
</script>

<button type="button" class="tool" class:beckon aria-pressed={pressed} {disabled} {onclick}>
	<Icon name={icon} />
	<span>{label}</span>
	{#if tag}
		<span class="state" aria-hidden="true">{tag}</span>
	{/if}
</button>

<style>
	.tool {
		position: relative;
		display: grid;
		justify-items: center;
		gap: 0.3rem;
		padding: 0.6rem 0.25rem 0.5rem;
		border: 0;
		border-radius: var(--radius-m);
		background: none;
		color: var(--ink-soft);
		font-size: var(--step--1);
		font-weight: 500;
		cursor: pointer;
		transition:
			background-color 160ms,
			color 160ms,
			opacity 160ms;
	}

	.tool:hover:not(:disabled) {
		background: var(--surface);
		color: var(--ink);
	}

	.tool:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.tool[aria-pressed='true'],
	.tool.beckon {
		color: var(--accent);
	}

	.tool.beckon {
		animation: nudge 1.2s ease-in-out infinite;
	}

	.state {
		position: absolute;
		top: 0.3rem;
		right: calc(50% - 1.6rem);
		padding: 0 0.3rem;
		border-radius: 999px;
		background: var(--surface);
		color: var(--ink-soft);
		font-size: 0.625rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.02em;
		line-height: 1.5;
		text-transform: uppercase;
	}

	.beckon .state {
		background: var(--accent-soft);
		color: var(--accent);
	}

	@keyframes nudge {
		50% {
			background: var(--accent-soft);
		}
	}
</style>
