import { Just, Nothing } from './Maybe';
import { Foldable } from './Foldable';

test('Foldable()', () => {
  const createFoldable = () => Foldable((_, seed) => seed);
  expect(createFoldable).not.toThrow();
  expect(createFoldable()).toBeInstanceOf(Foldable);
});
test('new Foldable()', () => {
  const createFoldable = () => new Foldable((_, seed) => seed);
  expect(createFoldable).not.toThrow();
  expect(createFoldable()).toBeInstanceOf(Foldable);
});
describe('Semigroup', () => {
  test('a.concat(b).concat(c) == a.concat(b.concat(c))', () => {
    const a = Foldable<number>((f, seed) => f(f(f(seed, 1), 2), 3));
    const b = Foldable<number>((f, seed) => f(f(seed, 8), 10));
    const c = Foldable<number>((_, seed) => seed);
    [
      [a, b, c],
      [a, c, b],
      [b, a, c],
      [b, c, a],
      [c, a, b],
      [c, b, a]
    ].forEach(([a, b, c]) => {
      expect(asArray(a.concat(b).concat(c))).toEqual(asArray(a.concat(b.concat(c))));
    });
  });
});
describe('Monoid', () => {
  const m = Foldable<number>((f, seed) => f(f(f(seed, 42), 37), 98));
  test('m.concat(M.empty()) == m', () => {
    expect(asArray(m.concat(Foldable.empty()))).toEqual(asArray(m));
  });
  test('M.empty().concat(m) == m', () => {
    expect(asArray(Foldable.empty<number>().concat(m))).toEqual(asArray(m));
  });
  test('m.constructor.empty', () => {
    expect(asArray(m.constructor.empty())).toEqual([]);
  });
});
describe('Filterable', () => {
  const v = Foldable<number>((f, seed) => f(f(f(seed, 1), 2), 3));
  const p = (x: number) => x % 2 === 0;
  const q = (x: number) => x % 3 === 0;
  const w = Foldable<number>((f, seed) => f(f(f(seed, 8), 9), 10));
  test('v.filter(x => p(x) && q(x)) == v.filter(p).filter(q)', () => {
    expect(asArray(v.filter(x => p(x) && q(x)))).toEqual(asArray(v.filter(p).filter(q)));
  });
  test('v.filter(x => true) == v', () => {
    expect(asArray(v.filter(_ => true))).toEqual(asArray(v));
  });
  test('v.filter(x => false) == w.filter(x => false)', () => {
    [
      [v, w],
      [w, v]
    ].forEach(([v, w]) => {
      expect(asArray(v.filter(_ => false))).toEqual(asArray(w.filter(_ => false)));
    });
  });
});
describe('Functor', () => {
  const u = Foldable<number>((f, seed) => f(f(f(seed, 1), 2), 3));
  const f = (x: number) => x / 3;
  const g = (x: number) => x - 9;
  test('u.map(a => a) == u', () => {
    expect(asArray(u.map(a => a))).toEqual(asArray(u));
  });
  test('u.map(x => f(g(x)) == u.map(g).map(f)', () => {
    expect(asArray(u.map(x => f(g(x))))).toEqual(asArray(u.map(g).map(f)));
  });
});
describe('Apply', () => {
  const f = (x: number) => x / 3;
  const g = (x: number) => x - 9;
  const a = Foldable((g, seed) => g(seed, f));
  const u = Foldable((f, seed) => f(seed, g));
  const v = Foldable((f, seed) => f(f(f(seed, 42), 45), 48));
  const n = Foldable((_, seed) => seed);
  const helperFn = (_f: typeof f) => (_g: typeof g) => (_x: number) => _f(_g(_x));
  test('v.ap(u.ap(a.map(f => g => x => f(g(x))))) == v.ap(u).ap(a)', () => {
    (<[Foldable<number>, Foldable<typeof g>, Foldable<typeof f>][]>[
      [v, u, a],
      [v, u, n],
      [v, n, a],
      [v, n, n],
      [n, u, a],
      [n, u, n],
      [n, n, a],
      [n, n, n]
    ]).forEach(([v, u, a]) => {
      expect(asArray(v.ap(u.ap(a.map(helperFn))))).toEqual(asArray(v.ap(u).ap(a)));
    });
  });
});
describe('Applicative', () => {
  const x = 42;
  const y = 600;
  const f = (x: number) => x / 3;
  const u = Foldable<typeof f>((g, seed) => g(seed, f));
  const v = Foldable<number>((f, seed) => f(seed, x));
  const n = Foldable<number>((_, seed) => seed);
  const id = <T>(x: T): T => x;
  const thrush = <A, B>(y: A) => (f: (_: A) => B): B => f(y);
  test('v.ap(A.of(x => x)) == v', () => {
    [v, n].forEach(v => {
      expect(asArray(v.ap<number>(Foldable.of(id)))).toEqual(asArray(v));
    });
  });
  test('A.of(x).ap(A.of(f)) == A.of(f(x))', () => {
    expect(asArray(Foldable.of(x).ap(Foldable.of(f)))).toEqual(asArray(Foldable.of(f(x))));
  });
  test('A.of(y).ap(u) == u.ap(A.of(f => f(y)))', () => {
    expect(asArray(Foldable.of(y).ap(u))).toEqual(asArray(u.ap(Foldable.of(thrush(y)))));
  });
  test('f.constructor.of', () => {
    expect(asArray(v.constructor.of(42))).toEqual(asArray(v));
  });
});
describe('Alt', () => {
  const a = Foldable<number>((f, seed) => f(f(seed, 42), 55));
  const b = Foldable<number>((_, seed) => seed);
  const c = Foldable<number>((f, seed) => f(seed, 60));
  const f = (x: number) => x / 3;
  const testSpace = [
    [a, b, c],
    [a, c, b],
    [b, a, c],
    [b, c, a],
    [c, a, b],
    [c, b, a]
  ];
  test(`a.alt(b).alt(c) == a.alt(b.alt(c))`, () => {
    testSpace.forEach(([a, b, c]) => {
      expect(a.alt(b).alt(c)).toEqual(a.alt(b.alt(c)));
    });
  });
  test(`a.alt(b).map(f) == a.map(f).alt(b.map(f))`, () => {
    testSpace.forEach(([a, b]) => {
      expect(asArray(a.alt(b).map(f))).toEqual(asArray(a.map(f).alt(b.map(f))));
    });
  });
});
describe('Plus', () => {
  const x = Foldable<number>((f, seed) => f(seed, 42));
  const n = Foldable<number>((_, seed) => seed);
  const z = Foldable.zero() as Foldable<number>;
  const f = (x: number) => x / 3;
  test(`x.alt(A.zero()) == A.zero().alt(x) == x`, () => {
    [x, n].forEach(x => {
      expect(asArray(x.alt(z))).toEqual(asArray(x));
      expect(asArray(z.alt(x))).toEqual(asArray(x));
    });
  });
  test('A.zero().map(f) == A.zero()', () => expect(asArray(z.map(f))).toEqual(asArray(z)));
  test('x.constructor.zero()', () => {
    [x, n].forEach(x => {
      expect(asArray(x.constructor.zero())).toEqual(asArray(z));
    });
  });
});
describe('Alternative', () => {
  const x = Foldable<number>((f, seed) => f(seed, 42));
  const n = Foldable<number>((_, seed) => seed);
  const f = Foldable.of((x: number) => x / 3);
  const g = Foldable.of((x: number) => x * 2);
  const h = Foldable<(_: number) => number>((_, seed) => seed);
  const z = Foldable.zero();
  test('x.ap(f.alt(g)) == x.ap(f).alt(x.ap(g))', () => {
    [x, n].forEach(x => {
      [
        [f, g],
        [f, h],
        [h, f],
        [h, h]
      ].forEach(([f, g]) => {
        expect(asArray(x.ap(f.alt(g)))).toEqual(asArray(x.ap(f).alt(x.ap(g))));
        expect(asArray(x.ap(g.alt(f)))).toEqual(asArray(x.ap(g).alt(x.ap(f))));
      });
    });
  });
  test('x.ap(A.zero()) == A.zero()', () => {
    expect(asArray(x.ap(z))).toEqual(asArray(z));
  });
});
describe('Foldable', () => {
  const u = Foldable<number>((f, seed) => f(f(f(f(f(seed, 1), 2), 3), 4), 5));
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

  const mn = Foldable.of(42);
  const mfn = Foldable.of<F<number>>(F.of(42));
  const mfgn = Foldable.of<F<G<number>>>(F.of(G.of(42)));
  const z = Foldable.zero();

  const t = <T>(f: F<T>): G<T> => G.of(f.fVal);
  test('t(u.traverse(F, x => x)) == u.traverse(G, t)', () => {
    [mfn, z].forEach(u => {
      expect(t(u.traverse(F, x => x) as F<Foldable<number>>).map(asArray)).toEqual(
        u.traverse(G, t).map(asArray)
      );
    });
  });
  test('u.traverse(F, F.of) == F.of(u)', () => {
    [mn, z].forEach(u => {
      expect(u.traverse(F, F.of).map(asArray)).toEqual(F.of(u).map(asArray));
    });
  });
  test('u.traverse(Compose, x => new Compose(x)) == new Compose(u.traverse(F, x => x).map(x => x.traverse(G, x => x)))', () => {
    [mfgn, z].forEach(u => {
      expect(u.traverse(Compose, x => new Compose(x)).map(asArray)).toEqual(
        new Compose(
          (u.traverse(F, x => x) as F<Foldable<G<number>>>).map(
            x => x.traverse(G, x => x) as G<Foldable<number>>
          )
        ).map(asArray)
      );
    });
  });
});
describe('Chain', () => {
  const m = Foldable.of(42);
  const f = (x: number) => Foldable.of(x / 3);
  const g = (x: number) => Foldable.of(x + 21);
  const h = (_: number) => Foldable.zero<number>();
  const n = Foldable.zero<number>();
  test('m.chain(f).chain(g) == m.chain(x => f(x).chain(g))', () => {
    [m, n].forEach(m => {
      [
        [f, g],
        [f, h],
        [h, g],
        [h, h]
      ].forEach(([f, g]) => {
        expect(asArray(m.chain(f).chain(g))).toEqual(asArray(m.chain(x => f(x).chain(g))));
      });
    });
  });
});
describe('Monad', () => {
  const a = 42;
  const m = Foldable.of(a);
  const n = Foldable.zero<number>();
  const o = Foldable<number>((f, seed) => f(f(f(seed, 42), 72), 36));
  const f = (x: number) => Foldable.of(x / 3);
  const g = (_: number): Foldable<number> => Foldable.zero();
  const h = (x: number) => Foldable((f, seed) => f(f(f(seed, x), x / 3), x * 2));
  test('M.of(a).chain(f) == f(a)', () => {
    [f, g, h].forEach(f => {
      expect(asArray(Foldable.of(a).chain(f))).toEqual(asArray(f(a)));
    });
  });
  test('m.chain(M.of) == m', () => {
    [m, n, o].forEach(m => {
      expect(asArray(m.chain(Foldable.of))).toEqual(asArray(m));
    });
  });
});
test('Foldable.prototype.count', () => {
  const a = Foldable((_, seed) => seed);
  const b = Foldable((f, seed) => f(seed, 42));
  const c = Foldable((f, seed) => f(f(f(seed, 1), 2), 3));
  expect(a.count()).toBe(0);
  expect(b.count()).toBe(1);
  expect(c.count()).toBe(3);
});
test('Foldable.prototype.head', () => {
  const a = Foldable.of(42);
  const b = Foldable<number>((f, seed) => f(f(f(seed, 1), 2), 3));
  const c = Foldable.zero();
  expect(a.head()).toEqual(Just(42));
  expect(b.head()).toEqual(Just(1));
  expect(c.head()).toEqual(Nothing);
});
test('Foldable.prototype.isEmpty', () => {
  const a = Foldable.of(42);
  const b = Foldable<number>((f, seed) => f(f(f(seed, 1), 2), 3));
  const c = Foldable.zero();
  expect(a.isEmpty()).toBe(false);
  expect(b.isEmpty()).toBe(false);
  expect(c.isEmpty()).toBe(true);
});
test('Foldable.prototype.limit', () => {
  const a = Foldable.of(42);
  const b = Foldable<number>((f, seed) => f(f(f(f(seed, 1), 2), 3), 4));
  const c = Foldable.zero();
  expect(asArray(a.limit(2))).toEqual([42]);
  expect(asArray(b.limit(2))).toEqual([1, 2]);
  expect(asArray(c.limit(2))).toEqual([]);
});
describe('Foldable.prototype.reduceRight', () => {
  const u = Foldable<string>((f, seed) => f(f(f(f(f(seed, '1'), '2'), '3'), '4'), '5'));
  test('u.reduceRight == u.reduceRight((acc, x) => acc.concat([x]), []).reduceRight', () => {
    const expected = u.reduceRight<string[]>((acc, x) => acc.concat([x]), []);
    const actual = u;
    const concat = (a: string, b: string): string => `${a}_${b}-`;
    const seed = '=';
    expect(actual.reduceRight(concat, seed)).toEqual(expected.reduce(concat, seed));
  });
});
test('Foldable.prototype.reverse', () => {
  const u = Foldable<number>((f, seed) => f(f(f(f(f(seed, 1), 2), 3), 4), 5));
  expect(asArray(u.reverse())).toEqual([5, 4, 3, 2, 1]);
});

test('Foldable.prototype.skip', () => {
  const u = Foldable<number>((f, seed) => f(f(f(f(f(seed, 1), 2), 3), 4), 5));
  expect(asArray(u.skip(-1))).toEqual([1, 2, 3, 4, 5]);
  expect(asArray(u.skip(0))).toEqual([1, 2, 3, 4, 5]);
  expect(asArray(u.skip(1))).toEqual([2, 3, 4, 5]);
  expect(asArray(u.skip(3))).toEqual([4, 5]);
  expect(asArray(u.skip(5))).toEqual([]);
  expect(asArray(u.skip(8))).toEqual([]);
});

test('Foldable.prototype.toArray', () => {
  const u = Foldable<number>((f, seed) => f(f(f(f(f(seed, 1), 2), 3), 4), 5));
  expect(u.toArray()).toEqual(asArray(u));
});

test('Foldable.prototype.transduce', () => {
  const u = Foldable<number>((f, seed) => f(f(f(f(f(seed, 1), 2), 3), 4), 5));
  expect(
    asArray(
      u.transduce(<T>(next: (acc: T, _: number) => T): typeof next => (acc, x) =>
        x > 3 ? next(next(acc, x + 2), x + 3) : acc
      )
    )
  ).toEqual([6, 7, 7, 8]);
});

test('Foldable.sequence', () => {
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
  const us = Foldable<number>((f, seed) => f(f(f(seed, 1), 3), 9)).map(x => new F(x * 2));
  [Foldable, us.constructor].forEach(M => {
    expect(M.sequence(F, us).map(asArray)).toEqual(F.of([2, 6, 18]));
  });
});

test('Foldable.from', () => {
  const a = Foldable<number>((f, seed) => f(f(f(seed, 1), 2), 3));
  const b = { 0: 4, 1: 5, 2: 6, length: 3 };
  const makeC = function*() {
    yield 7;
    yield 8;
    yield 9;
  };
  [Foldable, a.constructor].forEach(M => {
    expect(asArray(M.from(a))).toEqual([1, 2, 3]);
    expect(asArray(M.from(b))).toEqual([4, 5, 6]);
    expect(asArray(M.from(makeC()))).toEqual([7, 8, 9]);
  });
});

function asArray<A>(as: Foldable<A>): A[] {
  return as.reduce<A[]>((arr, x) => arr.concat([x]), []);
}
