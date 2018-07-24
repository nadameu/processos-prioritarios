import { Just, Maybe, Nothing } from '../../adt/Maybe';

export function queryOne<T extends Element>(
	selector: string,
	context: NodeSelector
): Maybe<T> {
	const elts = context.querySelectorAll<T>(selector);
	if (elts.length !== 1) return Nothing();
	return Just(elts[0]);
}
