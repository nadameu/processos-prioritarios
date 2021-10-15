type Component<T> = (props: Partial<T> | null, ...children: Array<string | Node>) => JSX.Element;
export function h<T>(
	tag: Component<T>,
	props: Partial<T> | null,
	...children: Array<string | JSX.Element>
): Node;
export function h(
	tag: keyof HTMLElementTagNameMap,
	props: JSX.IntrinsicElements[typeof tag],
	...children: Array<string | JSX.Element>
): Node;
export function h(
	tag: keyof HTMLElementTagNameMap | Component<Record<string, any>>,
	props: Record<string, any> | null,
	...children: Array<string | JSX.Element>
) {
	if (typeof tag === 'function') return tag(props, ...children);
	const element = document.createElement(tag);
	for (const [key, value] of Object.entries(props || {})) {
		if (key.startsWith('on')) {
			const name = key.slice(2);
			element.addEventListener(name, value);
		} else {
			(element as any)[key] = value;
		}
	}
	element.append(...children);
	return element;
}
export const Fragment: Component<{}> = (props: {} | null, ...children: Array<string | Node>) => {
	const fragment = document.createDocumentFragment();
	fragment.append(...children);
	return fragment;
};
