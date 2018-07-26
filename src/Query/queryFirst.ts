import { Maybe } from '../../adt/Maybe';

export function queryFirst<T extends Element>(
	selector: string,
	context: NodeSelector
): Maybe<T> {
	return Maybe.fromNullable(context.querySelector<T>(selector));
}
