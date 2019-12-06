import { Just, Maybe, Nothing } from '.';

test('Maybe.fromMaybe', () => {
  expect(Maybe.fromMaybe(Just(42), 0)).toEqual(42);
  expect(Maybe.fromMaybe(Nothing, 42)).toEqual(42);

  expect(Maybe.fromMaybe(0)(Just(42))).toEqual(42);
  expect(Maybe.fromMaybe(42)(Nothing)).toEqual(42);
});

test('Maybe.fromNullable', () => {
  expect(Maybe.fromNullable(null)).toEqual(Nothing);
  expect(Maybe.fromNullable(undefined)).toEqual(Nothing);
  expect(Maybe.fromNullable(0)).toEqual(Just(0));
  expect(Maybe.fromNullable(false)).toEqual(Just(false));
});
