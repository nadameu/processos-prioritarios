import { Just, Maybe, Nothing } from './defs';

export function fromNullable<a>(value: a | null | undefined): Maybe<a> {
  return value == null ? Nothing : Just(value);
}

export function lift2<a, b, c>(f: (_: a) => (_: b) => c, fx: Maybe<a>, fy: Maybe<b>): Maybe<c> {
  return fx.map(f).chain(f => fy.map(f));
}

export function of<a>(value: a): Maybe<a> {
  return Just(value);
}
