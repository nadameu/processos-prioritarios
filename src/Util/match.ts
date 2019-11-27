import { Maybe, maybe, pipe } from 'adt-ts';
export const match = (re: RegExp): ((text: string) => Maybe<RegExpMatchArray>) =>
  pipe(maybe.safeMethod('match', re));
