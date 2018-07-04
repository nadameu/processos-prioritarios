export const queryAll = <T extends Element>(
	selector: string,
	context: NodeSelector
): T[] => Array.from(context.querySelectorAll<T>(selector));
