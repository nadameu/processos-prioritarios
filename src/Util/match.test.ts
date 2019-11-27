import { maybe, Maybe, pipe, pipeValue } from 'adt-ts';
import { match } from './match';

test('match', () => {
  const f = pipe(match(/a(b)c/), from);
  expect(f('abc')).toEqual(['abc', 'b']);
  expect(f('abcd')).toEqual(['abc', 'b']);
  expect(f('abd')).toEqual([]);
});

function from(result: Maybe<RegExpMatchArray>): string[] {
  return pipeValue(result).pipe(
    maybe.map(xs => Array.from(xs)),
    maybe.fromMaybe([] as string[])
  );
}
