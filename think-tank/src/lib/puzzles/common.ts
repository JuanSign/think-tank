export type Difficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export const rank = (difficulty: Difficulty) => DIFFICULTIES.indexOf(difficulty);

export function shuffle<T>(items: T[]) {
	for (let i = items.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[items[i], items[j]] = [items[j], items[i]];
	}
	return items;
}

export const pick = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)];

export function combinations<T>(items: T[], size: number): T[][] {
	if (size === 0) return [[]];
	return items.flatMap((item, i) =>
		combinations(items.slice(i + 1), size - 1).map((rest) => [item, ...rest])
	);
}

export function joinAnd(items: (string | number)[]) {
	if (items.length < 2) return `${items[0]}`;
	return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

export function describeLines(kind: string, indices: number[]) {
	const numbers = [...indices].sort((a, b) => a - b).map((index) => index + 1);
	return numbers.length === 1 ? `${kind} ${numbers[0]}` : `${kind}s ${joinAnd(numbers)}`;
}
