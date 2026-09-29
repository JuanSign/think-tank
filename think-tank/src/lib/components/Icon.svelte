<script lang="ts" module>
	const PATHS = {
		back: ['M19 12H5', 'm11 18-6-6 6-6'],
		pause: ['M9 5v14', 'M15 5v14'],
		undo: ['M9 14 4 9l5-5', 'M4 9h10.5a5.5 5.5 0 0 1 0 11H11'],
		erase: ['M12.5 4.5 18 10l-8 8-5.5-5.5z', 'm7.2 9.8 5.5 5.5', 'M11 20.5h9'],
		notes: ['M12 20h9', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z'],
		hint: [
			'M9 18h6',
			'M10 22h4',
			'M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z'
		],
		clear: ['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5']
	};

	export type IconName = keyof typeof PATHS;
</script>

<script lang="ts">
	let { name }: { name: IconName } = $props();
</script>

<svg viewBox="0 0 24 24" aria-hidden="true">
	{#each PATHS[name] as d (d)}
		<path {d} />
	{/each}
</svg>

<style>
	svg {
		width: 1.375rem;
		height: 1.375rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
</style>
