import { Iter } from '../../adt/Iter';

export const queryAll = <T extends Element>(
	selector: string,
	context: NodeSelector
): Iter<T> => Iter.from(context.querySelectorAll<T>(selector));
