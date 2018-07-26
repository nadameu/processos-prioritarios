import { Just, Maybe, Nothing } from './Maybe';
import { access } from 'fs';

test('Just()', () => {
	const createJust = () => Just(42);
	expect(createJust).not.toThrow();
	expect(createJust()).toBeInstanceOf(Just);
	expect(createJust()).toBeInstanceOf(Maybe);
});
test('new Just()', () => {
	const createJust = () => new Just(42);
	expect(createJust).not.toThrow();
	expect(createJust()).toBeInstanceOf(Just);
	expect(createJust()).toBeInstanceOf(Maybe);
});
test('Nothing', () => {
	expect(Nothing).toBeInstanceOf(Maybe);
});
describe('Filterable', () => {
	const v = Just(42);
	const p = (x: number) => x % 2 === 0;
	const q = (x: number) => x % 3 === 0;
	const w = Just(1);
	test('v.filter(x => p(x) && q(x)) == v.filter(p).filter(q)', () => {
		[v, Nothing as Maybe<number>].forEach(v => {
			expect(v.filter(x => p(x) && q(x))).toEqual(v.filter(p).filter(q));
		});
	});
	test('v.filter(x => true) == v', () => {
		[v, Nothing as Maybe<number>].forEach(v => {
			expect(v.filter(_ => true)).toEqual(v);
		});
	});
	test('v.filter(x => false) == w.filter(x => false)', () => {
		[[v, w], [v, Nothing], [Nothing, w], [Nothing, Nothing]].forEach(
			([v, w]: Maybe<number>[]) => {
				expect(v.filter(_ => false)).toEqual(w.filter(_ => false));
			}
		);
	});
});
describe('Functor', () => {
	const u = Just(42);
	const f = (x: number) => x / 3;
	const g = (x: number) => x - 9;
	test('u.map(a => a) == u', () => {
		[u, Nothing as Maybe<number>].forEach(u => {
			expect(u.map(a => a)).toEqual(u);
		});
	});
	test('u.map(x => f(g(x)) == u.map(g).map(f)', () => {
		[u, Nothing as Maybe<number>].forEach(u => {
			expect(u.map(x => f(g(x)))).toEqual(u.map(g).map(f));
		});
	});
});
describe('Apply', () => {
	const x = 42;
	const f = (x: number) => x / 3;
	const g = (x: number) => x - 9;
	const a = Just(f);
	const u = Just(g);
	const v = Just(x);
	const n = Nothing as Maybe<any>;
	const helperFn = (_f: typeof f) => (_g: typeof g) => (_x: typeof x) =>
		_f(_g(_x));
	test('v.ap(u.ap(a.map(f => g => x => f(g(x))))) == v.ap(u).ap(a)', () => {
		(<[Maybe<typeof x>, Maybe<typeof g>, Maybe<typeof f>][]>[
			[v, u, a],
			[v, u, n],
			[v, n, a],
			[v, n, n],
			[n, u, a],
			[n, u, n],
			[n, n, a],
			[n, n, n],
		]).forEach(([v, u, a]) => {
			expect(v.ap(u.ap(a.map(helperFn)))).toEqual(v.ap(u).ap(a));
		});
	});
});
describe('Applicative', () => {
	const x = 42;
	const y = 600;
	const f = (x: number) => x / 3;
	const u = Just(f);
	const v = Just(x);
	const id = <T>(x: T): T => x;
	const thrush = <A, B>(y: A) => (f: (_: A) => B): B => f(y);
	test('v.ap(A.of(x => x)) == v', () => {
		[v, Nothing as Maybe<number>].forEach(v => {
			expect(v.ap(Maybe.of(id))).toEqual(v);
		});
	});
	test('A.of(x).ap(A.of(f)) == A.of(f(x))', () => {
		expect(Maybe.of(x).ap(Maybe.of(f))).toEqual(Maybe.of(f(x)));
	});
	test('A.of(y).ap(u) == u.ap(A.of(f => f(y)))', () => {
		[u, Nothing as Maybe<typeof f>].forEach(u => {
			expect(Maybe.of(y).ap(u)).toEqual(u.ap(Maybe.of(thrush(y))));
		});
	});
});
describe('Alt', () => {
	const a = Just(42) as Maybe<number>;
	const b = Nothing as Maybe<number>;
	const c = Just(60) as Maybe<number>;
	const f = (x: number) => x / 3;
	const testSpace = [
		[a, b, c],
		[a, c, b],
		[b, a, c],
		[b, c, a],
		[c, a, b],
		[c, b, a],
	];
	test(`a.alt(b).alt(c) == a.alt(b.alt(c))`, () => {
		testSpace.forEach(([a, b, c]) => {
			expect(a.alt(b).alt(c)).toEqual(a.alt(b.alt(c)));
		});
	});
	test(`a.alt(b).map(f) == a.map(f).alt(b.map(f))`, () => {
		testSpace.forEach(([a, b]) => {
			expect(a.alt(b).map(f)).toEqual(a.map(f).alt(b.map(f)));
		});
	});
});
describe('Plus', () => {
	const x = Just(42);
	const n = Nothing as Maybe<number>;
	const z = Maybe.zero() as Maybe<number>;
	const f = (x: number) => x / 3;
	test(`x.alt(A.zero()) == A.zero().alt(x) == x`, () => {
		[x, n].forEach(x => {
			expect(x.alt(z)).toEqual(x);
			expect(z.alt(x)).toEqual(x);
		});
	});
	test('A.zero().map(f) == A.zero()', () => expect(z.map(f)).toEqual(z));
});
describe('Alternative', () => {
	const x = Just(42);
	const n = Nothing as Maybe<number>;
	const f = Just((x: number) => x / 3);
	const g = Just((x: number) => x * 2);
	const h = Nothing as Maybe<(_: number) => number>;
	const z = Maybe.zero();
	test('x.ap(f.alt(g)) == x.ap(f).alt(x.ap(g))', () => {
		[x, n].forEach(x => {
			[[f, g], [f, h], [h, f], [h, h]].forEach(([f, g]) => {
				expect(x.ap(f.alt(g))).toEqual(x.ap(f).alt(x.ap(g)));
				expect(x.ap(g.alt(f))).toEqual(x.ap(g).alt(x.ap(f)));
			});
		});
	});
	test('x.ap(A.zero()) == A.zero()', () => {
		expect(x.ap(z)).toEqual(z);
	});
});
describe('Foldable', () => {
	const u = Just(42);
	const n = Nothing as Maybe<number>;
	test('u.reduce == u.reduce((acc, x) => acc.concat([x]), []).reduce', () => {
		[u, n].forEach(u => {
			const expected = u.reduce<number[]>((acc, x) => acc.concat([x]), []);
			const actual = u;
			const add = (a: number, b: number): number => a + b;
			const seed = 36;
			expect(actual.reduce(add, seed)).toEqual(expected.reduce(add, seed));
		});
	});
});
