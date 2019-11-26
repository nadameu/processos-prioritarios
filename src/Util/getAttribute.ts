import { Maybe } from '../../adt/Maybe';
export function getAttribute(name: string): (obj: Element) => Maybe<string> {
  return function(obj) {
    return Maybe.fromNullable(obj.getAttribute(name));
  };
}
