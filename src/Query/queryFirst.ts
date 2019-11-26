import { Maybe } from '../Maybe';

export function queryFirst<T extends Element>(selector: string, context: ParentNode): Maybe<T> {
  return Maybe.fromNullable(context.querySelector<T>(selector));
}
