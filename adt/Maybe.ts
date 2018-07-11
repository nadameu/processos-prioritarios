import { Apply } from './ADT';
import { Either, Left } from './Either';

type Nullable<A> = A | null | undefined;
export abstract class Maybe<A> implements Apply<Maybe<any>, A> {
	abstract maybe<B>(f: () => B, g: (_: A) => B): B;

	ap<B>(that: Maybe<(_: A) => B>): Maybe<B> {
		return this.chain(a => that.map(f => f(a)));
	}
	chain<B>(f: (_: A) => Maybe<B>): Maybe<B> {
		return this.maybe(() => (<any>this) as Maybe<never>, f);
	}
	filter<B extends A>(p: (a: A) => a is B): Maybe<B>;
	filter(p: (_: A) => boolean): Maybe<A>;
	filter(p: (_: A) => boolean): Maybe<A> {
		return this.chain(a => (p(a) ? just(a) : nothing()));
	}
	getOrElse(a: A): A {
		return this.maybe(() => a, a => a);
	}
	isJust(): this is Just<A> {
		return this.maybe(() => false, () => true);
	}
	isNothing(): this is Nothing {
		return this.maybe(() => true, () => false);
	}
	map<B>(f: (_: A) => B): Maybe<B> {
		return this.chain(a => just(f(a)));
	}
	mapNullable<B>(f: (_: A) => Nullable<B>): Maybe<B> {
		return this.chain(a => Maybe.fromNullable(f(a)));
	}

	static Just<A>(a: A): Just<A> {
		return new Just(a);
	}
	static Nothing() {
		return new Nothing();
	}

	static chainRec<A, B>(f: (_: A) => Maybe<Either<A, B>>, seed: A): Maybe<B> {
		let result = f(seed);
		while (result.isJust()) {
			const either = result.value;
			if (either.isRight()) return just(either.rightValue);
			result = f((either as Left<A>).leftValue);
		}
		return nothing();
	}

	static fromNullable<A>(value: Nullable<A>): Maybe<A> {
		return value == null ? nothing() : just(value);
	}
	static of<A>(value: A): Maybe<A> {
		return new Just(value);
	}
}

export class Just<A> extends Maybe<A> {
	constructor(public readonly value: A) {
		super();
	}
	maybe(_: any, f: Function) {
		return f(this.value);
	}
}
export const just = Maybe.Just;

export class Nothing extends Maybe<never> {
	constructor() {
		super();
	}
	maybe(f: Function) {
		return f();
	}
}
export const nothing = Maybe.Nothing;

declare module './Iter' {
	interface Iter<A> {
		sequence<F, B>(this: Iter<Maybe<B>>, A: typeof Maybe): Maybe<Iter<B>>;
		traverse<L, B>(A: typeof Maybe, f: (_: A) => Maybe<B>): Maybe<Iter<B>>;
	}
}

declare module './liftA' {
	export function liftA3<A, B, C, D>(
		f: (a: A, b: B, c: C) => D,
		fa: Maybe<A>,
		fb: Maybe<B>,
		fc: Maybe<C>
	): Maybe<D>;
	export function liftA4<A, B, C, D, E>(
		f: (a: A, b: B, c: C, d: D) => E,
		fa: Maybe<A>,
		fb: Maybe<B>,
		fc: Maybe<C>,
		fd: Maybe<D>
	): Maybe<E>;
}
