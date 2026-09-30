const APART = [
	[0, 44, 72, 165, 131, 77, 63],
	[44, 0, 44, 125, 83, 44, 81],
	[72, 44, 0, 47, 72, 72, 99],
	[165, 125, 47, 0, 119, 76, 87],
	[131, 83, 72, 119, 0, 44, 164],
	[77, 44, 72, 76, 44, 0, 91],
	[63, 81, 99, 87, 164, 91, 0]
];

let orders: number[][] | undefined;

export function paintRegions(size: number, regions: number[]) {
	const touching = Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
	regions.forEach((region, cell) => {
		const right = cell % size < size - 1 ? regions[cell + 1] : region;
		const below = cell + size < regions.length ? regions[cell + size] : region;
		for (const other of [right, below]) {
			if (other === region) continue;
			touching[region][other]++;
			touching[other][region]++;
		}
	});

	orders ??= permutations(APART.map((_, i) => i));
	let best = orders[0];
	let bestCost = Infinity;
	for (const colors of orders) {
		let cost = 0;
		for (let a = 0; a < size; a++) {
			for (let b = a + 1; b < size; b++) {
				if (touching[a][b]) cost += touching[a][b] / APART[colors[a]][colors[b]] ** 2;
			}
		}
		if (cost < bestCost) [best, bestCost] = [colors, cost];
	}
	return best;
}

function permutations(items: number[]): number[][] {
	if (items.length < 2) return [items];
	return items.flatMap((item, i) =>
		permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest])
	);
}
