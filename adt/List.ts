import { purry } from 'remeda';

export interface List<A> {
  (): LazyResult<A>;
}
type LazyResult<A> = Cons<A> | Nil;

export interface Nil {
  isNil: true;
}
export const Nil: Nil = { isNil: true };

export interface Cons<A> {
  isNil: false;
  head: A;
  tail: List<A>;
}
export function Cons<A>(head: A, tail: List<A>): Cons<A> {
  return { isNil: false, head, tail };
}

export namespace List {
  export function chain<A, B>(list: List<A>, f: (_: A) => List<B>): List<B>;
  export function chain<A, B>(f: (_: A) => List<B>): (list: List<A>) => List<B>;
  export function chain() {
    return purry(_chain, arguments);
  }
  function _chain<A, B>(list: List<A>, f: (_: A) => List<B>): List<B> {
    return () => {
      const result = list();
      return result.isNil ? result : _concat(f(result.head), _chain(result.tail, f))();
    };
  }

  export function concat<A>(listA: List<A>, listB: List<A>): List<A>;
  export function concat<A>(listB: List<A>): (listA: List<A>) => List<A>;
  export function concat() {
    return purry(_concat, arguments);
  }
  function _concat<A>(listA: List<A>, listB: List<A>): List<A> {
    return () => {
      const result = listA();
      return result.isNil ? listB() : Cons(result.head, () => _concat(result.tail, listB)());
    };
  }

  export function empty<A = never>(): List<A> {
    return () => Nil;
  }

  export function fromArguments<A>(...xs: A[]): List<A> {
    return () => _fromArrayLike(xs);
  }

  export function fromArrayLike<A>(arrayLike: ArrayLike<A>): List<A> {
    return () => _fromArrayLike(arrayLike);
  }
  function _fromArrayLike<A>(as: ArrayLike<A>, len: number = as.length, i = 0): LazyResult<A> {
    return i < len ? Cons(as[i], () => _fromArrayLike(as, len, i + 1)) : Nil;
  }

  export function fromGenerator<A>(generator: () => Iterator<A>): List<A> {
    return () => _fromIterator(generator());
  }

  export function fromIterable<A>(iterable: Iterable<A>): List<A> {
    return () => _fromIterator(iterable[Symbol.iterator]());
  }
  function _fromIterator<A>(
    iter: Iterator<A>,
    current: IteratorResult<A> = iter.next()
  ): LazyResult<A> {
    return current.done ? Nil : Cons(current.value, () => _fromIterator(iter));
  }

  export function map<A, B>(list: List<A>, f: (_: A) => B): List<B>;
  export function map<A, B>(f: (_: A) => B): (list: List<A>) => List<B>;
  export function map() {
    return purry(_map, arguments);
  }
  function _map<A, B>(list: List<A>, f: (_: A) => B): List<B> {
    return () => {
      const result = list();
      return result.isNil ? result : Cons(f(result.head), map(result.tail, f));
    };
  }

  export function match<A, B>(
    list: List<A>,
    def: { Nil(): B; Cons(value: A, next: List<A>): B }
  ): B;
  export function match<A, B>(def: {
    Nil(): B;
    Cons(value: A, next: List<A>): B;
  }): (list: List<A>) => B;
  export function match() {
    return purry(_match, arguments);
  }
  function _match<A, B>(list: List<A>, def: { Nil(): B; Cons(head: A, tail: List<A>): B }): B {
    const result = list();
    return result.isNil ? def.Nil() : def.Cons(result.head, result.tail);
  }

  export function of<A>(x: A): List<A> {
    return () => Cons(x, () => Nil);
  }

  export function reduce<A, B>(list: List<A>, f: (acc: B, _: A) => B, seed: B): B;
  export function reduce<A, B>(f: (acc: B, _: A) => B, seed: B): (list: List<A>) => B;
  export function reduce() {
    return purry(_reduce, arguments);
  }
  function _reduce<A, B>(list: List<A>, f: (acc: B, _: A) => B, seed: B): B {
    let acc = seed;
    let current = list();
    while (!current.isNil) {
      acc = f(acc, current.head);
      current = current.tail();
    }
    return acc;
  }

  export function unsafeReduceRight<A, B>(list: List<A>, f: (acc: B, _: A) => B, seed: B): B;
  export function unsafeReduceRight<A, B>(f: (acc: B, _: A) => B, seed: B): (list: List<A>) => B;
  export function unsafeReduceRight() {
    return purry(_unsafeReduceRight, arguments);
  }
  function _unsafeReduceRight<A, B>(list: List<A>, f: (acc: B, _: A) => B, seed: B): B {
    const result = list();
    return result.isNil ? seed : f(_unsafeReduceRight(result.tail, f, seed), result.head);
  }

  export function toArray<A>(list: List<A>): A[] {
    return _reduce(list, (a, b) => a.concat([b]), [] as A[]);
  }

  export function toIterable<A>(list: List<A>): Iterable<A> {
    return {
      [Symbol.iterator]() {
        let current = list;
        return {
          next() {
            const result = current();
            if (result.isNil) return { done: true, value: undefined as any };
            current = result.tail;
            return { done: false, value: result.head };
          }
        };
      }
    };
  }
}
