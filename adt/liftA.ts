import { Apply } from './ADT';

export function liftA1<A, B>(f: (a: A) => B, fa: Apply<A>): Apply<B> {
  return fa.map(f);
}

export function liftA2<A, B, C>(f: (a: A, b: B) => C, fa: Apply<A>, fb: Apply<B>): Apply<C> {
  return fb.ap(fa.map(a => (b: B) => f(a, b)));
}

export function liftA3<A, B, C, D>(
  f: (a: A, b: B, c: C) => D,
  fa: Apply<A>,
  fb: Apply<B>,
  fc: Apply<C>
): Apply<D> {
  return fc.ap(fb.ap(fa.map(a => (b: B) => (c: C) => f(a, b, c))));
}

export function liftA4<A, B, C, D, E>(
  f: (a: A, b: B, c: C, d: D) => E,
  fa: Apply<A>,
  fb: Apply<B>,
  fc: Apply<C>,
  fd: Apply<D>
): Apply<E> {
  return fd.ap(fc.ap(fb.ap(fa.map(a => (b: B) => (c: C) => (d: D) => f(a, b, c, d)))));
}
