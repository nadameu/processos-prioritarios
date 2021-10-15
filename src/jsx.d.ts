declare namespace JSX {
	type Element = Node;
	type IntrinsicElements = {
		[K in keyof HTMLElementTagNameMap]: Partial<HTMLElementTagNameMap[K]>;
	};
}
