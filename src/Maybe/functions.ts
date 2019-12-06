/* eslint-disable prefer-arrow-callback */

import { purry } from '../purry';
import { Maybe, Nothing, Just } from './definitions';

export function fromNullable<a>(value: a | null | undefined): Maybe<a> {
  return value == null ? Nothing : Just(value);
}

export const fromMaybe = purry(function fromMaybe<a>(maybe: Maybe<a>, defaultValue: a): a {
  return maybe.isJust ? maybe.value : defaultValue;
}) as {
  <a>(defaultValue: a): (maybe: Maybe<a>) => a;
  <a>(maybe: Maybe<a>, defaultValue: a): a;
};

export const map = purry(function map<a, b>(maybe: Maybe<a>, f: (_: a) => b): Maybe<b> {
  return maybe.isJust ? Just(f(maybe.value)) : Nothing;
}) as {
  <a, b>(f: (_: a) => b): (maybe: Maybe<a>) => Maybe<b>;
  <a, b>(maybe: Maybe<a>, f: (_: a) => b): Maybe<b>;
};

export const maybe = purry(function maybe<a, b>(
  maybe: Maybe<a>,
  whenNothing: b,
  whenJust: (value: a) => b
): b {
  return maybe.isJust ? whenJust(maybe.value) : whenNothing;
}) as {
  <a, b>(whenNothing: b, whenJust: (value: a) => b): (maybe: Maybe<a>) => b;
  <a, b>(maybe: Maybe<a>, whenNothing: b, whenJust: (value: a) => b): b;
};

export const maybeL = purry(function maybeL<a, b>(
  maybe: Maybe<a>,
  whenNothing: () => b,
  whenJust: (value: a) => b
): b {
  return maybe.isJust ? whenJust(maybe.value) : whenNothing();
}) as {
  <a, b>(whenNothing: () => b, whenJust: (value: a) => b): (maybe: Maybe<a>) => b;
  <a, b>(maybe: Maybe<a>, whenNothing: () => b, whenJust: (value: a) => b): b;
};
