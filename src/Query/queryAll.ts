import { Foldable } from '../../adt/Foldable';

export const queryAll = <T extends Element>(
	selector: string,
	context: NodeSelector
): Foldable<T> => Foldable.from(context.querySelectorAll<T>(selector));
