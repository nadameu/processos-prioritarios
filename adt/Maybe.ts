import { Applicative, Apply } from './ADT';

type Nullable<A> = A | null | undefined;

abstract class Maybe$abstract<A> {
	abstract isNothing: boolean;
	abstract isJust: boolean;
	abstract maybe<B>(b: B, f: (_: A) => B): B;

	alt(that: Maybe<A>): Maybe<A> {
		return this.maybe(that, () => (<any>this) as Just<A>);
	}
	ap<B>(that: Maybe<(_: A) => B>): Maybe<B> {
		return this.chain(a => that.map(f => f(a)));
	}
	chain<B>(f: (_: A) => Maybe<B>): Maybe<B> {
		return this.maybe(Nothing, f);
	}
	filter<B extends A>(p: (a: A) => a is B): Maybe<B>;
	filter(p: (_: A) => boolean): Maybe<A>;
	filter(p: (_: A) => boolean): Maybe<A> {
		return this.chain(a => (p(a) ? Just(a) : Nothing));
	}
	getOrElse(a: A): A {
		return this.maybe(a, a => a);
	}
	map<B>(f: (_: A) => B): Maybe<B> {
		return this.chain(a => Just(f(a)));
	}
	reduce<B>(f: (acc: B, a: A) => B, seed: B): B {
		return this.maybe(seed, a => f(seed, a));
	}
	traverse<B>(A: Applicative, f: (_: A) => Apply<B>): Apply<Maybe<B>> {
		return this.reduce<Apply<Maybe<B>>>(
			(acc, a) => f(a).ap(acc.map(ma => (b: B) => ma.alt(Maybe.of(b)))),
			A.of(Nothing)
		);
	}
}
const Maybe$static = {
	chainRec<A, B>(
		f: <C>(next: (_: A) => C, done: (_: B) => C, _: A) => Maybe<C>,
		seed: A
	): Maybe<B> {
		type Next = { isDone: false; value: A };
		type Done = { isDone: true; value: B };
		type Result = Next | Done;
		const next = (value: A): Next => ({ isDone: false, value });
		const done = (value: B): Done => ({ isDone: true, value });
		let value = seed;
		while (true) {
			const result = f<Result>(next, done, value);
			if (result.isNothing) return result as Maybe<never>;
			if (result.value.isDone) return Just(result.value.value);
			value = result.value.value;
		}
	},

	fromNullable<A>(a: Nullable<A>): Maybe<A> {
		return a == null ? Nothing : Just(a);
	},

	of<A>(value: A): Maybe<A> {
		return Just(value);
	},

	zero<A = never>(): Maybe<A> {
		return Nothing;
	},
};
type Maybe$static = typeof Maybe$static;
interface MaybeConstructor extends Maybe$static {}

export interface Just<A> extends Maybe$abstract<A> {
	constructor: JustConstructor;
	isJust: true;
	isNothing: false;
	value: A;
	traverse<B>(A: Applicative, f: (_: A) => Apply<B>): Apply<Just<B>>;
}
interface JustConstructor extends MaybeConstructor {
	new <A>(value: A): Just<A>;
	<A>(value: A): Just<A>;
}
export const Just: JustConstructor = Object.assign(function Just<A>(value: A): Just<A> {
	const ret = Object.create(Just.prototype);
	ret.isNothing = false;
	ret.value = value;
	return ret;
}, Maybe$static) as any;
Just.prototype = Object.create(Maybe$abstract.prototype);
Just.prototype.constructor = Just;
Just.prototype.isJust = true;
Just.prototype.maybe = function<B, A>(this: Just<A>, _: B, f: (_: A) => B): B {
	return f(this.value);
};

export interface Nothing<A = never> extends Maybe$abstract<A> {
	constructor: NothingConstructor;
	isJust: false;
	isNothing: true;
	traverse<B>(A: Applicative, f: (_: A) => Apply<B>): Apply<Nothing<B>>;
}
interface NothingConstructor extends MaybeConstructor {
	new <A = never>(): Nothing<A>;
	<A = never>(): Nothing<A>;
}
const _Nothing: NothingConstructor = Object.assign(function _Nothing<A = never>(): Nothing<A> {
	const ret = Object.create(_Nothing.prototype);
	ret.isNothing = true;
	return ret;
}, Maybe$static) as any;
_Nothing.prototype = Object.create(Maybe$abstract.prototype);
_Nothing.prototype.constructor = _Nothing;
_Nothing.prototype.isJust = false;
_Nothing.prototype.maybe = function<B>(b: B): B {
	return b;
};
export const Nothing = _Nothing();

export type Maybe<A> = Just<A> | Nothing<A>;
export const Maybe: MaybeConstructor = Object.assign(Maybe$abstract, Maybe$static) as any;

declare module './Foldable' {
	interface Foldable<A> {
		traverse<B>(A: typeof Maybe, f: (_: A) => Maybe<B>): Maybe<Foldable<B>>;
	}
	interface FoldableConstructor {
		sequence<A>(A: typeof Maybe, as: Foldable<Maybe<A>>): Maybe<Foldable<A>>;
	}
}

declare module './liftA' {
	export function liftA1<A, B>(f: (a: A) => B, fa: Maybe<A>): Maybe<B>;
	export function liftA2<A, B, C>(f: (a: A, b: B) => C, fa: Maybe<A>, fb: Maybe<B>): Maybe<C>;
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
