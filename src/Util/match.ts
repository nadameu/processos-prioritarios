import { Maybe } from '../../adt/Maybe';
export function match(re: RegExp): (text: string) => Maybe<RegExpMatchArray> {
  return function(text) {
    return Maybe.fromNullable(text.match(re));
  };
}
