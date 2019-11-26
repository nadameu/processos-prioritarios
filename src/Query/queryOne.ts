import { Just, Maybe, Nothing } from '../Maybe';

export function queryOne<T extends Element>(selector: string, context: ParentNode): Maybe<T> {
  const elts = context.querySelectorAll<T>(selector);
  if (elts.length !== 1) return Nothing;
  return Just(elts[0]);
}
