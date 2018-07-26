type Nullable<A> = A | null | undefined;

abstract class _Maybe<A> {
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

	static chainRec<A, B>(
		f: <C>(next: (_: A) => C, done: (_: B) => C, _: A) => Maybe<C>,
		seed: A
	): Maybe<B> {
		type Next = { isDone: false; value: A };
		type Done = { isDone: true; value: B };
		type Result = Next | Done;
		const next = (value: A): Next => ({ isDone: false, value });
		const done = (value: B): Done => ({ isDone: true, value });
		let result = f<Result>(next, done, seed);
		while (result.isJust) {
			if (result.value.isDone) return Just(result.value.value);
			result = f<Result>(next, done, result.value.value);
		}
		return Nothing;
	}

	static fromNullable<A>(a: Nullable<A>): Maybe<A> {
		return a == null ? Nothing : Just(a);
	}

	static of<A>(value: A): Maybe<A> {
		return Just(value);
	}

	static zero<A = never>(): Maybe<A> {
		return Nothing;
	}
}
type C = typeof _Maybe;
interface MaybeConstructor extends C {}

export interface Just<A> extends _Maybe<A> {
	isJust: true;
	isNothing: false;
	value: A;
}
interface JustConstructor {
	new <A>(value: A): Just<A>;
	<A>(value: A): Just<A>;
}
export const Just: JustConstructor = function Just<A>(value: A): Just<A> {
	const ret = Object.create(Just.prototype);
	ret.isNothing = false;
	ret.value = value;
	return ret;
} as any;
Just.prototype = Object.create(_Maybe.prototype);
Just.prototype.constructor = Just;
Just.prototype.isJust = true;
Just.prototype.maybe = function<B, A>(this: Just<A>, _: B, f: (_: A) => B): B {
	return f(this.value);
};

export interface Nothing<A = never> extends _Maybe<A> {
	isJust: false;
	isNothing: true;
}
function _Nothing<A = never>(): Nothing<A> {
	const ret = Object.create(_Nothing.prototype);
	ret.isNothing = true;
	return ret;
}
_Nothing.prototype = Object.create(_Maybe.prototype);
_Nothing.prototype.constructor = _Nothing;
_Nothing.prototype.isJust = false;
_Nothing.prototype.maybe = function<B>(b: B): B {
	return b;
};
export const Nothing = _Nothing();

export type Maybe<A> = Just<A> | Nothing<A>;
export const Maybe: MaybeConstructor = _Maybe as any;

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
	export function liftA2<A, B, C>(
		f: (a: A, b: B) => C,
		fa: Maybe<A>,
		fb: Maybe<B>
	): Maybe<C>;
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
