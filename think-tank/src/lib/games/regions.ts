export function joins(size: number, regions: ArrayLike<unknown>, cell: number) {
	const row = Math.floor(cell / size);
	const col = cell % size;
	const same = (dr: number, dc: number) => {
		const r = row + dr;
		const c = col + dc;
		return r >= 0 && r < size && c >= 0 && c < size && regions[r * size + c] === regions[cell];
	};

	const [n, s, e, w] = [same(-1, 0), same(1, 0), same(0, 1), same(0, -1)];
	const [nw, ne, sw, se] = [same(-1, -1), same(-1, 1), same(1, -1), same(1, 1)];

	return {
		east: e,
		south: s,
		corner: s && e && se,
		'flat-nw': n || w,
		'flat-ne': n || e,
		'flat-sw': s || w,
		'flat-se': s || e,
		'bend-nw': n && w && !nw,
		'bend-ne': n && e && !ne,
		'bend-sw': s && w && !sw,
		'bend-se': s && e && !se,
		'line-n': e && (n || ne),
		'line-e': e || (s && se),
		'line-s': s || (e && se),
		'line-w': s && (w || sw)
	};
}
