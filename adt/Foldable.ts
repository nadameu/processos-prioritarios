import { Applicative, Apply } from './ADT';
import { liftA2 } from './liftA';
import { Just, Maybe, Nothing } from './Maybe';

interface Reduce<A> {
  <B>(f: (acc: B, a: A) => B, seed: B): B;
}
type Reducer<A, B> = (acc: B, _: A) => B;

abstract class Foldable$abstract<A> {
  abstract reduce<B>(f: (acc: B, _: A) => B, seed: B): B;

  alt(that: Foldable<A>): Foldable<A> {
    if (this.isEmpty()) return that;
    return (<any>this) as Foldable<A>;
  }
  ap<B>(that: Foldable<(_: A) => B>): Foldable<B> {
    return that.chain(f => this.map(f));
  }
  chain<B>(f: (_: A) => Foldable<B>): Foldable<B> {
    return this.transduce(
      <C>(next: Reducer<B, C>): Reducer<A, C> => (acc, a) => f(a).reduce(next, acc)
    );
  }
  concat(that: Foldable<A>): Foldable<A> {
    return Foldable((f, seed) => that.reduce(f, this.reduce(f, seed)));
  }
  count(): number {
    return this.reduce(acc => acc + 1, 0);
  }
  filter<B extends A>(p: (a: A) => a is B): Foldable<B>;
  filter(p: (_: A) => boolean): Foldable<A>;
  filter(p: (_: A) => boolean) {
    return this.transduce(
      <C>(next: Reducer<A, C>): Reducer<A, C> => (acc, a) => (p(a) ? next(acc, a) : acc)
    );
  }
  head(): Maybe<A> {
    let found = false;
    return this.reduce<Maybe<A>>((acc, x) => {
      if (found) return acc;
      found = true;
      return Just(x);
    }, Nothing);
  }
  isEmpty(): boolean {
    return this.head().isNothing;
  }
  limit(n: number): Foldable<A> {
    return Foldable((f, seed) => {
      let i = -1;
      return this.reduce((acc, a) => {
        if (++i >= n) return acc;
        return f(acc, a);
      }, seed);
    });
  }
  map<B>(f: (_: A) => B): Foldable<B> {
    return this.transduce(<C>(next: Reducer<B, C>): Reducer<A, C> => (acc, a) => next(acc, f(a)));
  }
  reduceRight<B>(f: (acc: B, a: A) => B, seed: B): B {
    return this.toArray().reduceRight((acc, a) => f(acc, a), seed);
  }
  reverse(): Foldable<A> {
    return Foldable((f, seed) => this.reduceRight(f, seed));
  }
  skip(n: number): Foldable<A> {
    return Foldable((f, seed) => {
      let i = -1;
      return this.reduce((acc, a) => (++i < n ? acc : f(acc, a)), seed);
    });
  }
  toArray(): Array<A> {
    return this.reduce<A[]>((acc, a) => (acc.push(a), acc), []);
  }
  transduce<B>(transducer: <C>(next: Reducer<B, C>) => Reducer<A, C>): Foldable<B> {
    return Foldable((next, seed) => this.reduce(transducer(next), seed));
  }
  traverse<B>(A: Applicative, f: (_: A) => Apply<B>): Apply<Foldable<B>> {
    return this.reduce(
      (acc, a) => liftA2((a, b) => a.concat(Foldable.of(b)), acc, f(a)),
      A.of(Foldable.empty())
    );
  }
}
const Foldable$static = {
  empty<A = never>(): Foldable<A> {
    return Foldable((_, seed) => seed);
  },
  from<A>(as: Foldable<A> | ArrayLike<A> | Iterable<A>): Foldable<A> {
    if (as instanceof Foldable) return as;
    if ('length' in as)
      return Foldable((f, seed) => {
        const len = as.length;
        let acc = seed;
        for (let i = 0; i < len; i++) {
          acc = f(acc, as[i]);
        }
        return acc;
      });
    return Foldable((f, seed) => {
      let acc = seed;
      const iter = as[Symbol.iterator]();
      for (let result = iter.next(); !result.done; result = iter.next()) {
        acc = f(acc, result.value);
      }
      return acc;
    });
  },
  of<A>(a: A): Foldable<A> {
    return Foldable((f, seed) => f(seed, a));
  },
  sequence<A>(A: Applicative, fas: Foldable<Apply<A>>): Apply<Foldable<A>> {
    return fas.traverse(A, x => x);
  },
  zero<A = never>(): Foldable<A> {
    return Foldable((_, seed) => seed);
  }
};
type Foldable$static = typeof Foldable$static;
interface FoldableConstructor extends Foldable$static {
  new <A>(reduce: Reduce<A>): Foldable<A>;
  <A>(reduce: Reduce<A>): Foldable<A>;
}
export interface Foldable<A> extends Foldable$abstract<A> {
  constructor: FoldableConstructor;
  traverse<B>(A: Applicative, f: (_: A) => Apply<B>): Apply<Foldable<B>>;
}
export const Foldable: FoldableConstructor = Object.assign(
  function<A>(reduce: Reduce<A>): Foldable<A> {
    const ret = Object.create(Foldable.prototype);
    ret.reduce = reduce;
    return ret;
  } as any,
  Foldable$static
);
Foldable.prototype = Object.create(Foldable$abstract.prototype);
Foldable.prototype.constructor = Foldable;

declare module './liftA' {
  export function liftA1<A, B>(f: (a: A) => B, fa: Foldable<A>): Foldable<B>;
  export function liftA2<A, B, C>(
    f: (a: A, b: B) => C,
    fa: Foldable<A>,
    fb: Foldable<B>
  ): Foldable<C>;
  export function liftA3<A, B, C, D>(
    f: (a: A, b: B, c: C) => D,
    fa: Foldable<A>,
    fb: Foldable<B>,
    fc: Foldable<C>
  ): Foldable<D>;
  export function liftA4<A, B, C, D, E>(
    f: (a: A, b: B, c: C, d: D) => E,
    fa: Foldable<A>,
    fb: Foldable<B>,
    fc: Foldable<C>,
    fd: Foldable<D>
  ): Foldable<E>;
}
