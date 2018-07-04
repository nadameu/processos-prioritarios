export function pipeline<A>(a: A): A;
export function pipeline<A, B>(a: A, f: (_: A) => B): B;
export function pipeline<A, B, C>(a: A, f: (_: A) => B, g: (_: B) => C): C;
export function pipeline<A, B, C, D>(
	a: A,
	f: (_: A) => B,
	g: (_: B) => C,
	h: (_: C) => D
): D;
export function pipeline<A, B, C, D, E>(
	a: A,
	f: (_: A) => B,
	g: (_: B) => C,
	h: (_: C) => D,
	i: (_: D) => E
): E;
export function pipeline(a: any, ...fs: Function[]) {
	return fs.reduce((result, f) => f(result), a);
}
