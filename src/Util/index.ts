import { Maybe, maybe } from 'adt-ts';
interface HasNumericIndex<A> {
  [index: number]: A;
}
export function index(i: number): <A>(obj: HasNumericIndex<A>) => Maybe<A> {
  return function(obj) {
    return maybe.fromNullable(obj[i]);
  };
}
