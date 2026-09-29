export type Letter = { char: string; at: number; hold: number };
export type Typed = { words: Letter[][]; end: number };
export type TypedBlocks = { blocks: Typed[]; end: number };
export type TypedStory = { title: Typed; body: TypedBlocks };

const WORD_PAUSE = 70;
const PARAGRAPH_PAUSE = 400;

export function typeOut(text: string, clock = 0): Typed {
	const words: Letter[][] = [];
	let n = 0;

	for (const word of text.split(' ')) {
		const letters: Letter[] = [];
		for (const char of word) {
			const step = 30 + ((n++ * 17) % 31);
			letters.push({ char, at: clock, hold: step });
			clock += step;
		}
		letters[letters.length - 1].hold += WORD_PAUSE;
		clock += WORD_PAUSE;
		words.push(letters);
	}

	return { words, end: clock };
}

export function typeParagraphs(texts: string[], clock = 0): TypedBlocks {
	const blocks = texts.map((text) => {
		const typed = typeOut(text, clock);
		clock = typed.end + PARAGRAPH_PAUSE;
		return typed;
	});
	return { blocks, end: clock };
}

export function typeStory(title: string, paragraphs: string[]): TypedStory {
	return { title: typeOut(title), body: typeParagraphs(paragraphs) };
}
