import { Maybe, maybe } from 'adt-ts';
export function getAttribute(name: string): (obj: Element) => Maybe<string> {
  return function(obj) {
    return maybe.fromNullable(obj.getAttribute(name));
  };
}
