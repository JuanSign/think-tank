import type { Attachment } from 'svelte/attachments';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function typeOnce(): Attachment<HTMLElement> {
	return (node) => {
		gsap.registerPlugin(ScrollTrigger);

		node.dataset.typing = 'waiting';

		const trigger = ScrollTrigger.create({
			trigger: node.querySelector('h2') ?? node,
			start: 'top 85%',
			once: true,
			onEnter: () => {
				node.dataset.typing = 'play';
			}
		});

		return () => {
			trigger.kill();
			delete node.dataset.typing;
		};
	};
}
