import { Either, Left, Right } from './Either';

test('Right()', () => {
	const createRight = () => Right(42);
	expect(createRight).not.toThrow();
	expect(createRight()).toBeInstanceOf(Right);
	expect(createRight()).toBeInstanceOf(Either);
});
test('new Right()', () => {
	const createRight = () => new Right(42);
	expect(createRight).not.toThrow();
	expect(createRight()).toBeInstanceOf(Right);
	expect(createRight()).toBeInstanceOf(Either);
});
test('Left()', () => {
	const createLeft = () => Left(42);
	expect(createLeft).not.toThrow();
	expect(createLeft()).toBeInstanceOf(Left);
	expect(createLeft()).toBeInstanceOf(Either);
});
test('new Left()', () => {
	const createLeft = () => new Left(42);
	expect(createLeft).not.toThrow();
	expect(createLeft()).toBeInstanceOf(Left);
	expect(createLeft()).toBeInstanceOf(Either);
});
describe('Functor', () => {
	const u1 = Right(42) as Either<string, number>;
	const u2 = Left('error') as Either<string, number>;
	const f = (x: number) => x / 3;
	const g = (x: number) => x - 9;
	test('u.map(a => a) == u', () => {
		[u1, u2].forEach(u => {
			expect(u.map(a => a)).toEqual(u);
		});
	});
	test('u.map(x => f(g(x)) == u.map(g).map(f)', () => {
		[u1, u2].forEach(u => {
			expect(u.map(x => f(g(x)))).toEqual(u.map(g).map(f));
		});
	});
});
describe('Apply', () => {
	const x = 42;
	const f = (x: number) => x / 3;
	const g = (x: number) => x - 9;
	type nrFn = (_: number) => number;
	const a = Right(f) as Either<string, nrFn>;
	const u = Right(g) as Either<string, nrFn>;
	const v = Right(x) as Either<string, number>;
	const n = Left('error') as Either<string, number>;
	const helperFn = (_f: nrFn) => (_g: nrFn) => (_x: number) => _f(_g(_x));
	test('v.ap(u.ap(a.map(f => g => x => f(g(x))))) == v.ap(u).ap(a)', () => {
		([[v, u, a], [v, u, n], [v, n, a], [v, n, n], [n, u, a], [n, u, n], [n, n, a], [n, n, n]] as [
			Either<string, number>,
			Either<string, nrFn>,
			Either<string, nrFn>
		][]).forEach(([v, u, a]) => {
			expect(v.ap(u.ap(a.map(helperFn)))).toEqual(v.ap(u).ap(a));
		});
	});
});
describe('Applicative', () => {
	const x = 42;
	const y = 600;
	const f = (x: number) => x / 3;
	const u = Right(f) as Either<string, typeof f>;
	const ul = Left('error') as Either<string, typeof f>;
	const v = Right(x) as Either<string, number>;
	const n = Left('error') as Either<string, number>;
	const id = <T>(x: T): T => x;
	const thrush = <A, B>(y: A) => (f: (_: A) => B): B => f(y);
	test('v.ap(A.of(x => x)) == v', () => {
		[v, n].forEach(v => {
			expect(v.ap(Either.of(id))).toEqual(v);
		});
	});
	test('A.of(x).ap(A.of(f)) == A.of(f(x))', () => {
		expect(Either.of(x).ap(Either.of(f))).toEqual(Either.of(f(x)));
	});
	test('A.of(y).ap(u) == u.ap(A.of(f => f(y)))', () => {
		[u, ul].forEach(u => {
			expect(Either.of(y).ap(u)).toEqual(u.ap(Either.of(thrush(y))));
		});
	});
	test('f.constructor.of', () => {
		[v, ul].forEach(f => {
			expect(f.constructor.of(800)).toEqual(Right(800));
		});
	});
});
describe('Alt', () => {
	const a = Right(42) as Either<string, number>;
	const b = Left('error') as Either<string, number>;
	const c = Right(60) as Either<string, number>;
	const f = (x: number) => x / 3;
	const testSpace = [[a, b, c], [a, c, b], [b, a, c], [b, c, a], [c, a, b], [c, b, a]];
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
describe('Chain', () => {
	const m = Right(42) as Either<string, number>;
	const n = Left('error') as Either<string, number>;
	const f = (x: number) => Right(x / 3) as Either<string, number>;
	const g = (x: number) => Right(x + 21) as Either<string, number>;
	const h = (_: number): Either<string, number> => Left('error');
	test('m.chain(f).chain(g) == m.chain(x => f(x).chain(g))', () => {
		[m, n].forEach(m => {
			[[f, g], [f, h], [h, g], [h, h]].forEach(([f, g]) => {
				expect(m.chain(f).chain(g)).toEqual(m.chain(x => f(x).chain(g)));
			});
		});
	});
});
describe('ChainRec', () => {
	test('M.chainRec((next, done, v) => p(v) ? d(v).map(done) : n(v).map(next), i) == (function step(v) { return p(v) ? d(v) : n(v).chain(step); }(i))', () => {
		const p = (v: number): boolean => v >= 5;
		const d = Right;
		const n = (v: number) => Right(v + 1) as Either<string, number>;
		const i = 0;
		expect(Either.chainRec((next, done, v) => (p(v) ? d(v).map(done) : n(v).map(next)), i)).toEqual(
			(function step(v): Either<string, number> {
				return p(v) ? d(v) : n(v).chain(step);
			})(i)
		);
	});
	test('m.constructor.chainRec(f, i)', () => {
		const m = Right(42) as Either<string, number>;
		const n = Left('error') as Either<string, number>;
		const limit = 5;
		const f = <I>(next: (_: number) => I, done: (_: number) => I, v: number): Either<string, I> =>
			v >= limit ? Right(v).map(done) : Right(v + 1).map(next);
		const i = 0;
		[m, n].forEach(m => {
			expect(m.constructor.chainRec(f, i)).toEqual(Right(limit));
		});
	});
	test('Stack safety', () => {
		const limit = 1e5;
		const f = <I>(next: (_: number) => I, done: (_: number) => I, v: number): Either<string, I> =>
			v >= limit ? Right(v).map(done) : Right(v + 1).map(next);
		const i = 0;
		expect(() => Either.chainRec(f, i)).not.toThrow();
	});
	test('function returns a Left value', () => {
		expect(
			Either.chainRec((next, done, v) => (v < 0 ? Left(v) : Right(v - 1).map(next)), 45)
		).toEqual(Left(-1));
	});
});
describe('Monad', () => {
	const a = 42;
	const m = Right(a) as Either<string, number>;
	const n = Left('error') as Either<string, number>;
	const f = (x: number): Either<string, number> => Right(x / 3);
	const g = (_: number): Either<string, number> => Left('error');
	test('M.of(a).chain(f) == f(a)', () => {
		[f, g].forEach(f => {
			expect(Either.of(a).chain(f)).toEqual(f(a));
		});
	});
	test('m.chain(M.of) == m', () => {
		[m, n].forEach(m => {
			expect(m.chain(Either.of)).toEqual(m);
		});
	});
});
describe('Bifunctor', () => {
	const p = Right(42) as Either<string, number>;
	const q = Left('error') as Either<string, number>;
	const f = (x: string) => `f(${x})`;
	const g = (x: string) => `g(${x})`;
	const h = (x: number) => x * 3;
	const i = (x: number) => x - 2;
	test('p.bimap(a => a, b => b) == p', () => {
		[p, q].forEach(p => {
			expect(p.bimap(a => a, b => b)).toEqual(p);
		});
	});
	test('p.bimap(a => f(g(a)), b => h(i(b))) == p.bimap(g, i).bimap(f, h)', () => {
		[p, q].forEach(p => {
			[[f, g], [g, f]].forEach(([f, g]) => {
				[[h, i], [i, h]].forEach(([h, i]) => {
					expect(p.bimap(a => f(g(a)), b => h(i(b)))).toEqual(p.bimap(g, i).bimap(f, h));
				});
			});
		});
	});
});
describe('Either.prototype.chainLeft', () => {
	const a = 42;
	const m = Left(a) as Either<number, string>;
	const n = Right('error') as Either<number, string>;
	const f = (x: number): Either<number, string> => Left(x / 3);
	const g = (_: number): Either<number, string> => Right('error');
	test('Left(a).chainLeft(f) == f(a)', () => {
		[f, g].forEach(f => {
			expect(Left<number, string>(a).chainLeft(f)).toEqual(f(a));
		});
	});
	test('m.chainLeft(Left) == m', () => {
		[m, n].forEach(m => {
			expect(m.chainLeft(Left)).toEqual(m);
		});
	});
});
describe('Either.prototype.mapLeft', () => {
	const u1 = Left(42) as Either<number, string>;
	const u2 = Right('error') as Either<number, string>;
	const f = (x: number) => x / 3;
	const g = (x: number) => x - 9;
	test('u.mapLeft(a => a) == u', () => {
		[u1, u2].forEach(u => {
			expect(u.mapLeft(a => a)).toEqual(u);
		});
	});
	test('u.mapLeft(x => f(g(x)) == u.mapLeft(g).mapLeft(f)', () => {
		[u1, u2].forEach(u => {
			expect(u.mapLeft(x => f(g(x)))).toEqual(u.mapLeft(g).mapLeft(f));
		});
	});
});
test('Either.try', () => {
	const f = (): number => 42;
	const g = (): number => {
		throw 'error';
	};
	expect(Either.try(f)).toEqual(Right(42));
	expect(Either.try(g)).toEqual(Left('error'));
});
