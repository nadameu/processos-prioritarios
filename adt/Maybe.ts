import { Applicative, Apply } from './ADT';

class MaybeBase<A> {
  constructor() {
    throw new TypeError();
  }

  alt(that: Maybe<A>): Maybe<A>;
  alt(this: Maybe<A>, that: Maybe<A>): Maybe<A> {
    return this.isNothing ? that : this;
  }

  ap<B>(that: Maybe<(_: A) => B>): Maybe<B>;
  ap<B>(this: Maybe<A>, that: Maybe<(_: A) => B>): Maybe<B> {
    return that.isJust ? this.map(that.value) : (that as Nothing);
  }

  chain<B>(f: (_: A) => Maybe<B>): Maybe<B>;
  chain<B>(this: Just<A> | Nothing, f: (_: A) => Maybe<B>): Maybe<B> {
    return this.isNothing ? this : f(this.value);
  }

  filter<B extends A>(p: (value: A) => value is B): Maybe<B>;
  filter(p: (_: A) => boolean): Maybe<A>;
  filter(this: Maybe<A>, p: (_: A) => boolean): Maybe<A> {
    return this.isJust && p(this.value) ? this : Nothing;
  }

  getOrElse(defaultValue: A): A;
  getOrElse(this: Maybe<A>, defaultValue: A): A {
    return this.isNothing ? defaultValue : this.value;
  }

  map<B>(f: (_: A) => B): Maybe<B>;
  map<B>(this: Just<A> | Nothing, f: (_: A) => B): Maybe<B> {
    return this.isNothing ? this : Just(f(this.value));
  }

  reduce<B>(f: (acc: B, _: A) => B, seed: B): B;
  reduce<B>(this: Maybe<A>, f: (acc: B, _: A) => B, seed: B): B {
    return this.isNothing ? seed : f(seed, this.value);
  }

  traverse<B>(A: Applicative, f: (_: A) => Apply<B>): Apply<Maybe<B>>;
  traverse<B>(this: Just<A> | Nothing, A: Applicative, f: (_: A) => Apply<B>): Apply<Maybe<B>> {
    return this.isNothing ? A.of(this) : f(this.value).map(Maybe.of);
  }

  static chainRec<A, B>(
    f: <C>(next: (_: A) => C, done: (_: B) => C, value: A) => Maybe<C>,
    seed: A
  ): Maybe<B> {
    type Result = Next | Done;
    type Next = { isDone: false; next: A };
    type Done = { isDone: true; value: B };
    const n = (next: A): Result => ({ isDone: false, next });
    const d = (value: B): Result => ({ isDone: true, value });
    let value = seed;
    while (true) {
      const result = f(n, d, value);
      if (result.isNothing) return result as Nothing;
      const inner = result.value;
      if (inner.isDone) return Just(inner.value);
      value = inner.next;
    }
  }
  static fromNullable<A>(value: A | null | undefined): Maybe<A> {
    return value == null ? Nothing : Just(value);
  }
  static of<A>(value: A): Maybe<A> {
    return Just(value);
  }
  static zero<A = never>(): Maybe<A> {
    return Nothing;
  }
}

type C = typeof MaybeBase;
type MaybeConstructor = C;

export type Maybe<A> = Just<A> | Nothing<A>;
export const Maybe: MaybeConstructor = MaybeBase;

export interface Just<A> extends MaybeBase<A> {
  constructor: MaybeConstructor;
  isJust: true;
  isNothing: false;
  readonly value: A;
}
export function Just<A>(value: A): Just<A> {
  return Object.assign(Object.create(MaybeBase.prototype), {
    isJust: true as true,
    isNothing: false as false,
    value
  });
}

export interface Nothing<A = never> extends MaybeBase<A> {
  constructor: MaybeConstructor;
  isJust: false;
  isNothing: true;
}
export const Nothing: Nothing = Object.assign(Object.create(MaybeBase.prototype), {
  isJust: false as false,
  isNothing: true as true
});

export function sequenceA<A>(A: Applicative, maybe: Maybe<Apply<A>>): Apply<Maybe<A>> {
  return maybe.traverse(A, x => x);
}
