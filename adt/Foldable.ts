import { Applicative, Apply } from './ADT';
import { liftA2 } from './liftA';

interface IFoldable<A> {
	<B>(f: (acc: B, a: A) => B, seed: B): B;
}
type Reducer<A, B> = (acc: B, _: A) => B;

class FoldableImpl<A> {
	reduce: IFoldable<A>;
	constructor(reduce: IFoldable<A>) {
		if (!(this instanceof Foldable)) return new FoldableImpl(reduce);
		this.reduce = reduce;
	}

	chain<B>(f: (_: A) => Foldable<B>): Foldable<B> {
		return this.transduce(
			<C>(next: Reducer<B, C>): Reducer<A, C> => (acc, a) =>
				f(a).reduce(next, acc)
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
			<C>(next: Reducer<A, C>): Reducer<A, C> => (acc, a) =>
				p(a) ? next(acc, a) : acc
		);
	}
	isEmpty(): boolean {
		const escape = {};
		try {
			return this.reduce(() => {
				throw escape;
			}, true);
		} catch (e) {
			if (e === escape) return false;
			throw e;
		}
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
		return this.transduce(
			<C>(next: Reducer<B, C>): Reducer<A, C> => (acc, a) => next(acc, f(a))
		);
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
	transduce<B>(
		transducer: <C>(next: Reducer<B, C>) => Reducer<A, C>
	): Foldable<B> {
		return Foldable((next, seed) => this.reduce(transducer(next), seed));
	}
	traverse<B>(A: Applicative, f: (_: A) => Apply<B>): Apply<Foldable<B>> {
		return this.reduce(
			(acc, a) => liftA2((a, b) => a.concat(Foldable.of(b)), acc, f(a)),
			A.of(Foldable.empty())
		);
	}

	static empty<A = never>(): Foldable<A> {
		return Foldable((_, seed) => seed);
	}
	static from<A>(as: Foldable<A> | ArrayLike<A> | Iterable<A>): Foldable<A> {
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
	}
	static of<A>(a: A): Foldable<A> {
		return Foldable((f, seed) => f(seed, a));
	}
	static sequence<A>(
		A: Applicative,
		fas: Foldable<Apply<A>>
	): Apply<Foldable<A>> {
		return fas.traverse(A as any, (x: any) => x);
	}
}
export interface Foldable<A> extends FoldableImpl<A> {}
type Id<A> = A;
interface FoldableConstructor extends Id<typeof FoldableImpl> {
	<A>(reduce: IFoldable<A>): Foldable<A>;
}
export const Foldable = FoldableImpl as FoldableConstructor;
