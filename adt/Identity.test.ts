import { Identity, sequenceA } from './Identity';

test('Identity()', () => {
	const createIdentity = () => Identity(42);
	expect(createIdentity).not.toThrow();
	expect(createIdentity()).toBeInstanceOf(Identity);
});
test('new Identity()', () => {
	const createIdentity = () => new Identity(42);
	expect(createIdentity).not.toThrow();
	expect(createIdentity()).toBeInstanceOf(Identity);
});
describe('Functor', () => {
	const u = Identity(42);
	const f = (x: number) => x / 3;
	const g = (x: number) => x - 9;
	test('u.map(a => a) == u', () => {
		expect(u.map(a => a)).toEqual(u);
	});
	test('u.map(x => f(g(x)) == u.map(g).map(f)', () => {
		expect(u.map(x => f(g(x)))).toEqual(u.map(g).map(f));
	});
});
describe('Apply', () => {
	const x: number = 42;
	const f = (x: number) => x / 3;
	const g = (x: number) => x - 9;
	const a = Identity(f);
	const u = Identity(g);
	const v = Identity(x);
	const helperFn = (_f: typeof f) => (_g: typeof g) => (_x: typeof x) => _f(_g(_x));
	test('v.ap(u.ap(a.map(f => g => x => f(g(x))))) == v.ap(u).ap(a)', () => {
		expect(v.ap(u.ap(a.map(helperFn)))).toEqual(v.ap(u).ap(a));
	});
});
describe('Applicative', () => {
	const x = 42;
	const y = 600;
	const f = (x: number) => x / 3;
	const u = Identity(f) as Identity<typeof f>;
	const v = Identity(x) as Identity<number>;
	const id = <T>(x: T): T => x;
	const thrush = <A, B>(y: A) => (f: (_: A) => B): B => f(y);
	test('v.ap(A.of(x => x)) == v', () => {
		expect(v.ap(Identity.of(id))).toEqual(v);
	});
	test('A.of(x).ap(A.of(f)) == A.of(f(x))', () => {
		expect(Identity.of(x).ap(Identity.of(f))).toEqual(Identity.of(f(x)));
	});
	test('A.of(y).ap(u) == u.ap(A.of(f => f(y)))', () => {
		expect(Identity.of(y).ap(u)).toEqual(u.ap(Identity.of(thrush(y))));
	});
	test('v.constructor.of', () => {
		expect(v.constructor.of(800)).toEqual(Identity(800));
	});
});

describe('Foldable', () => {
	const u = Identity(42);
	test('u.reduce == u.reduce((acc, x) => acc.concat([x]), []).reduce', () => {
		const expected = u.reduce<number[]>((acc, x) => acc.concat([x]), []);
		const actual = u;
		const add = (a: number, b: number): number => a + b;
		const seed = 36;
		expect(actual.reduce(add, seed)).toEqual(expected.reduce(add, seed));
	});
});
describe('Traversable', () => {
	class F<T> {
		type: 'F' = 'F';
		constructor(public fVal: T) {}
		ap<U>(that: F<(_: T) => U>): F<U> {
			return F.of(that.fVal(this.fVal));
		}
		map<U>(f: (_: T) => U): F<U> {
			return F.of(f(this.fVal));
		}
		static of<T>(fVal: T): F<T> {
			return new F(fVal);
		}
	}
	class G<T> {
		type: 'G' = 'G';
		constructor(public gVal: T) {}
		ap<U>(that: G<(_: T) => U>): G<U> {
			return G.of(that.gVal(this.gVal));
		}
		map<U>(f: (_: T) => U): G<U> {
			return G.of(f(this.gVal));
		}
		static of<T>(fVal: T): G<T> {
			return new G(fVal);
		}
	}
	class Compose<T> {
		constructor(readonly c: F<G<T>>) {}
		ap<U>(that: Compose<(_: T) => U>): Compose<U> {
			return new Compose(this.c.ap(that.c.map(u => (y: G<T>) => y.ap(u))));
		}
		map<U>(f: (_: T) => U): Compose<U> {
			return new Compose(this.c.map(y => y.map(f)));
		}
		static of<T>(x: T): Compose<T> {
			return new Compose(F.of(G.of(x)));
		}
	}

	const idNumber = Identity(42);
	const idFNumber = Identity(F.of(42)) as Identity<F<number>>;
	const idFGNumber = Identity(F.of(G.of(42))) as Identity<F<G<number>>>;

	const t = <T>(f: F<T>): G<T> => G.of(f.fVal);
	test('t(u.traverse(F, x => x)) == u.traverse(G, t)', () => {
		expect(t(idFNumber.traverse(F, x => x) as F<Identity<number>>)).toEqual(
			idFNumber.traverse(G, t)
		);
	});
	test('u.traverse(F, F.of) == F.of(u)', () => {
		expect(idNumber.traverse(F, F.of)).toEqual(F.of(idNumber));
	});
	test('u.traverse(Compose, x => new Compose(x)) == new Compose(u.traverse(F, x => x).map(x => x.traverse(G, x => x)))', () => {
		expect(idFGNumber.traverse(Compose, x => new Compose(x))).toEqual(
			new Compose(
				(idFGNumber.traverse(F, x => x) as F<Identity<G<number>>>).map(
					x => x.traverse(G, x => x) as G<Identity<number>>
				)
			)
		);
	});
	test('t(sequenceA(F, u)) == sequenceA(G, u.map(t))', () => {
		expect(t(sequenceA(F, idFNumber) as F<Identity<number>>)).toEqual(
			sequenceA(G, idFNumber.map(t))
		);
	});
	test('sequenceA(F, u.map(F.of) == F.of(u)', () => {
		expect(sequenceA(F, idNumber.map(F.of))).toEqual(F.of(idNumber));
	});
});
describe('Chain', () => {
	const m = Identity(42) as Identity<number>;
	const f = (x: number) => Identity(x / 3);
	const g = (x: number) => Identity(x + 21);
	test('m.chain(f).chain(g) == m.chain(x => f(x).chain(g))', () => {
		expect(m.chain(f).chain(g)).toEqual(m.chain(x => f(x).chain(g)));
	});
});
describe('ChainRec', () => {
	test('M.chainRec((next, done, v) => p(v) ? d(v).map(done) : n(v).map(next), i) == (function step(v) { return p(v) ? d(v) : n(v).chain(step); }(i))', () => {
		const p = (v: number): boolean => v >= 5;
		const d = Identity;
		const n = (v: number) => Identity(v + 1);
		const i = 0;
		expect(
			Identity.chainRec((next, done, v) => (p(v) ? d(v).map(done) : n(v).map(next)), i)
		).toEqual(
			(function step(v): Identity<number> {
				return p(v) ? d(v) : n(v).chain(step);
			})(i)
		);
	});
	test('m.constructor.chainRec(f, i)', () => {
		const m = Identity(42) as Identity<number>;
		const limit = 5;
		const f = <I>(next: (_: number) => I, done: (_: number) => I, v: number): Identity<I> =>
			v >= limit ? Identity(v).map(done) : Identity(v + 1).map(next);
		const i = 0;
		expect(m.constructor.chainRec(f, i)).toEqual(Identity(limit));
	});
	test('Stack safety', () => {
		const limit = 1e5;
		const f = <I>(next: (_: number) => I, done: (_: number) => I, v: number): Identity<I> =>
			v >= limit ? Identity(v).map(done) : Identity(v + 1).map(next);
		const i = 0;
		expect(() => Identity.chainRec(f, i)).not.toThrow();
	});
});
describe('Monad', () => {
	const a = 42;
	const m = Identity(a) as Identity<number>;
	const f = (x: number) => Identity(x / 3);
	test('M.of(a).chain(f) == f(a)', () => {
		expect(Identity.of(a).chain(f)).toEqual(f(a));
	});
	test('m.chain(M.of) == m', () => {
		expect(m.chain(Identity.of)).toEqual(m);
	});
});
