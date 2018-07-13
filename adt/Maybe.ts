type Nullable<A> = A | null | undefined;

type INothing = { isNothing: true };
type IJust<A> = { isNothing: false; value: A };
type IMaybe<A> = INothing | IJust<A>;

class MaybeImpl<A> {
	isNothing: boolean;
	isJust: boolean;
	maybe: <B>(f: () => B, g: (_: A) => B) => B;
	constructor(maybe: IMaybe<A>) {
		this.isNothing = maybe.isNothing;
		this.isJust = !maybe.isNothing;
		this.maybe = maybe.isNothing ? f => f() : (_, g) => g(maybe.value);
	}

	ap<B>(that: Maybe<(_: A) => B>): Maybe<B> {
		return this.chain(a => that.map(f => f(a)));
	}
	chain<B>(f: (_: A) => Maybe<B>): Maybe<B> {
		return this.maybe(() => (<any>this) as Nothing, f);
	}
	filter<B extends A>(p: (a: A) => a is B): Maybe<B>;
	filter(p: (_: A) => boolean): Maybe<A>;
	filter(p: (_: A) => boolean): Maybe<A> {
		return this.chain(a => (p(a) ? Just(a) : Nothing()));
	}
	getOrElse(a: A): A {
		return this.maybe(() => a, a => a);
	}
	map<B>(f: (_: A) => B): Maybe<B> {
		return this.chain(a => Just(f(a)));
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
		return Nothing();
	}

	static fromNullable<A>(a: Nullable<A>): Maybe<A> {
		return a == null ? Nothing() : Just(a);
	}

	static lift<A, B>(f: (_: A) => Nullable<B>): (_: A) => Maybe<B> {
		return function(a) {
			return Maybe.fromNullable(f(a));
		};
	}

	static of<A>(value: A): Maybe<A> {
		return Just(value);
	}
}

class JustImpl<A> extends MaybeImpl<A> {
	isJust: true = true;
	isNothing: false = false;
	constructor(readonly value: A) {
		super({ isNothing: false, value });
	}
}
export interface Just<A> extends JustImpl<A> {}
export function Just<A>(value: A): Just<A> {
	return new JustImpl(value);
}

class NothingImpl<A = never> extends MaybeImpl<A> {
	isJust: false = false;
	isNothing: true = true;
	constructor() {
		super({ isNothing: true });
	}
}
export interface Nothing<A = never> extends NothingImpl<A> {}
export function Nothing<A = never>(): Nothing<A> {
	return new NothingImpl();
}

export type Maybe<A> = Just<A> | Nothing<A>;
export const Maybe = MaybeImpl;

declare module './Iter' {
	interface Iter<A> {
		sequence<F, B>(this: Iter<Maybe<B>>, A: typeof Maybe): Maybe<Iter<B>>;
		traverse<L, B>(A: typeof Maybe, f: (_: A) => Maybe<B>): Maybe<Iter<B>>;
	}
}

declare module './liftA' {
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
