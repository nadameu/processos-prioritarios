import { Applicative, Apply } from './ADT';

type Reduce<T> = <U>(f: Reducer<T, U>, seed: U) => U;
type Reducer<T, U> = (acc: U, a: T) => U;
type Transducer<T, U> = <V>(next: Reducer<U, V>) => Reducer<T, V>;

export class Iter<A> implements Iterable<A> {
	[Symbol.iterator](): Iterator<A> {
		return this.toArray()[Symbol.iterator]();
	}

	constructor(public readonly reduce: Reduce<A>) {}

	chain<B>(f: (_: A) => Iter<B> | ArrayLike<B> | Iterable<B>): Iter<B> {
		return this.transduce(
			<C>(next: Reducer<B, C>): Reducer<A, C> => (acc, a) =>
				Iter.from(f(a)).reduce(next, acc)
		);
	}
	concat(that: Iter<A>): Iter<A> {
		return new Iter((f, seed) => that.reduce(f, this.reduce(f, seed)));
	}
	filter<B extends A>(p: (a: A) => a is B): Iter<B>;
	filter(p: (_: A) => boolean): Iter<A>;
	filter(p: (_: A) => boolean): Iter<A> {
		return this.transduce(
			<C>(next: Reducer<A, C>): Reducer<A, C> => (acc, a) =>
				p(a) ? next(acc, a) : acc
		);
	}
	forEach(f: (_: A) => void): void {
		this.reduce((_, a) => void f(a), undefined);
	}
	map<B>(f: (_: A) => B): Iter<B> {
		return this.transduce(
			<C>(next: Reducer<B, C>): Reducer<A, C> => (acc, a) => next(acc, f(a))
		);
	}
	sequence<F>(this: Iter<Apply<F, A>>, A: Applicative<F>): Apply<F, Iter<A>> {
		return this.traverse(A, a => a);
	}
	transduce<B>(transducer: Transducer<A, B>): Iter<B> {
		return new Iter((next, seed) =>
			this.reduce((acc, a) => transducer(next)(acc, a), seed)
		);
	}
	traverse<F, B>(
		A: Applicative<F>,
		f: (_: A) => Apply<F, B>
	): Apply<F, Iter<B>> {
		return this.reduce<Apply<F, Iter<B>>>(
			(acc, a) => f(a).ap(acc.map(bs => (b: B) => bs.concat(Iter.of(b)))),
			A.of(Iter.empty())
		);
	}
	toArray(): Array<A> {
		return this.reduce<A[]>((acc, a) => acc.concat([a]), []);
	}

	static empty<A>(): Iter<A> {
		return new Iter((_: any, seed) => seed);
	}
	static from<A>(as: Iter<A> | ArrayLike<A> | Iterable<A>) {
		if (as instanceof Iter) return as;
		if ('length' in as) {
			return new Iter<A>((f, seed) => {
				const len = as.length;
				let acc = seed;
				for (let i = 0; i < len; i++) {
					acc = f(acc, as[i]);
				}
				return acc;
			});
		}
		return new Iter<A>((f, seed) => {
			let acc = seed;
			for (const a of as) {
				acc = f(acc, a);
			}
			return acc;
		});
	}
	static of<A>(a: A): Iter<A> {
		return new Iter((f, seed) => f(seed, a));
	}
}
