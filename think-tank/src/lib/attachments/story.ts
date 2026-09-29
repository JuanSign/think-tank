import type { Attachment } from 'svelte/attachments';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { restAt, sectionStartsAt } from '$lib/smooth-scroll';
import type { Typed, TypedStory } from '$lib/typing';

export type ChartEntrance = (timeline: gsap.core.Timeline, figure: HTMLElement) => void;
export type Pacing = { typeFrom: number; typeTo: number; textDone: number };

export const ARRIVING: Pacing = { typeFrom: 0.9, typeTo: 0.75, textDone: 0.35 };
export const READING: Pacing = { typeFrom: 0.72, typeTo: 0.6, textDone: 0.28 };

export const CLIPPED = 'inset(0% 100% 0% 0% round var(--radius-s))';
export const UNCLIPPED = 'inset(0% 0% 0% 0% round var(--radius-s))';

const SCRUB = 0.25;
const READING_GAP = 0.12;
const CHART_GAP = 0.04;
const CHART_EXIT = 0.25;
const REST_PAST = 0.03;

export function story(
	typed: TypedStory,
	{ pacing = ARRIVING, enterChart }: { pacing?: Pacing; enterChart?: ChartEntrance } = {}
): Attachment<HTMLElement> {
	return (beat) => {
		gsap.registerPlugin(ScrollTrigger);

		const text = beat.querySelector<HTMLElement>('.beat-text')!;
		const heading = text.querySelector<HTMLElement>('.beat-title')!;
		const chars = [...text.querySelectorAll<HTMLElement>('.char')];
		const figure = beat.querySelector<HTMLElement>('figure');

		const titleTimes = typingTimes(typed.title);
		const bodyTimes = typed.body.blocks.flatMap(typingTimes);

		const headingAt = (screenY: number) =>
			scrollWhen(heading.getBoundingClientRect().top, innerHeight * screenY);

		const mm = gsap.matchMedia();

		mm.add(
			{ wide: '(min-width: 56rem)', motion: '(prefers-reduced-motion: no-preference)' },
			(context) => {
				const { wide, motion } = context.conditions!;
				if (!motion) return;

				const clock = { title: 0, body: 0 };
				let shown = 0;

				function render() {
					const title = typedCount(titleTimes, clock.title);
					const count =
						title < titleTimes.length ? title : title + typedCount(bodyTimes, clock.body);
					if (count === shown) return;

					for (let i = Math.min(count, shown); i < Math.max(count, shown); i++) {
						chars[i].toggleAttribute('data-typed', i < count);
					}
					chars[shown - 1]?.removeAttribute('data-caret');
					chars[count - 1]?.setAttribute('data-caret', '');
					shown = count;
				}

				text.dataset.typing = '';

				const typingTitle = gsap.to(clock, {
					title: typed.title.end,
					ease: 'none',
					onUpdate: render,
					scrollTrigger: {
						trigger: heading,
						start: () => headingAt(pacing.typeFrom),
						end: () => headingAt(pacing.typeTo),
						scrub: SCRUB
					}
				});

				const typingBody = gsap.to(clock, {
					body: typed.body.end,
					ease: 'none',
					onUpdate: render,
					scrollTrigger: {
						trigger: text,
						start: () => typingTitle.scrollTrigger!.end + innerHeight * READING_GAP,
						end: () =>
							Math.max(
								headingAt(pacing.textDone),
								scrollWhen(text.getBoundingClientRect().bottom, innerHeight * 0.95)
							),
						scrub: SCRUB
					}
				});

				let complete = () => typingBody.scrollTrigger!.end;

				if (figure && enterChart) {
					const chartIn = gsap
						.timeline({ paused: true, defaults: { ease: 'expo.out' } })
						.from(figure, { opacity: 0, y: '0.75rem', duration: 0.6 })
						.from(
							figure.querySelector('figcaption'),
							{ opacity: 0, y: '0.75rem', duration: 0.5 },
							0.15
						);
					enterChart(chartIn, figure);
					chartIn.from(
						figure.querySelector('.source'),
						{ opacity: 0, duration: 0.5 },
						chartIn.duration() - 0.2
					);

					let chartOut: gsap.core.Tween | undefined;

					const hideChart = context.add('hideChart', () => {
						chartIn.pause();
						chartOut = gsap.to(figure, {
							opacity: 0,
							y: '0.75rem',
							duration: CHART_EXIT,
							ease: 'power2.in',
							onComplete: () => chartIn.pause(0)
						});
					});

					const chartTrigger = ScrollTrigger.create({
						trigger: figure,
						start: () =>
							Math.max(
								typingBody.scrollTrigger!.end + innerHeight * CHART_GAP,
								wide ? 0 : scrollWhen(figure.getBoundingClientRect().top, innerHeight * 0.75)
							),
						onEnter: () => {
							chartOut?.kill();
							chartIn.restart();
						},
						onLeaveBack: () => hideChart()
					});

					complete = () => chartTrigger.start;
				}

				const stopResting = restAt(() => complete() + innerHeight * REST_PAST);
				const stopStarting = sectionStartsAt(() => typingTitle.scrollTrigger!.start);

				return () => {
					stopResting();
					stopStarting();
					delete text.dataset.typing;
					for (const char of chars) {
						char.removeAttribute('data-typed');
						char.removeAttribute('data-caret');
					}
				};
			}
		);

		return () => mm.revert();
	};
}

function typingTimes(typed: Typed) {
	return typed.words.flat().map((letter) => letter.at);
}

function typedCount(times: number[], clock: number) {
	let count = 0;
	while (count < times.length && times[count] < clock) count++;
	return count;
}

function scrollWhen(edge: number, atY: number) {
	return edge + scrollY - atY;
}
