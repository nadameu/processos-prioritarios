import { maybe, Maybe } from 'adt-ts';

export function queryFirst<T extends Element>(selector: string, context: ParentNode): Maybe<T> {
  return maybe.fromNullable(context.querySelector<T>(selector));
}
