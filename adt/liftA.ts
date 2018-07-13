import { Apply } from './ADT';

export function liftA2<F, A, B, C>(
	f: (a: A, b: B) => C,
	fa: Apply<F, A>,
	fb: Apply<F, B>
): Apply<F, C> {
	return fb.ap(fa.map(a => (b: B) => f(a, b)));
}

export function liftA3<F, A, B, C, D>(
	f: (a: A, b: B, c: C) => D,
	fa: Apply<F, A>,
	fb: Apply<F, B>,
	fc: Apply<F, C>
): Apply<F, D> {
	return fc.ap(fb.ap(fa.map(a => (b: B) => (c: C) => f(a, b, c))));
}

export function liftA4<F, A, B, C, D, E>(
	f: (a: A, b: B, c: C, d: D) => E,
	fa: Apply<F, A>,
	fb: Apply<F, B>,
	fc: Apply<F, C>,
	fd: Apply<F, D>
): Apply<F, E> {
	return fd.ap(
		fc.ap(fb.ap(fa.map(a => (b: B) => (c: C) => (d: D) => f(a, b, c, d))))
	);
}
