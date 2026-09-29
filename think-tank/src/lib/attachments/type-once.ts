import type { Attachment } from 'svelte/attachments';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sectionStartsAt } from '$lib/smooth-scroll';

const START_AT = 0.85;

export function typeOnce(): Attachment<HTMLElement> {
	return (node) => {
		gsap.registerPlugin(ScrollTrigger);

		const heading = node.querySelector('h2') ?? node;

		node.dataset.typing = 'waiting';

		const trigger = ScrollTrigger.create({
			trigger: heading,
			start: `top ${START_AT * 100}%`,
			once: true,
			onEnter: () => {
				node.dataset.typing = 'play';
			}
		});

		const stopStarting = sectionStartsAt(
			() => heading.getBoundingClientRect().top + scrollY - innerHeight * START_AT
		);

		return () => {
			stopStarting();
			trigger.kill();
			delete node.dataset.typing;
		};
	};
}
