/* === Base === */
abstract class MaybeBase<A> {
	abstract maybe<B>(f: () => B, g: (_: A) => B): B;
	ap<B>(that: MaybeBase<(_: A) => B>): Maybe<B> {
		return this.chain(a => that.map(f => f(a)));
	}
	chain<B>(f: (_: A) => Maybe<B>): Maybe<B> {
		return this.maybe(Nothing, f);
	}
	map<B>(f: (_: A) => B): Maybe<B> {
		return this.maybe(Nothing, a => Just(f(a)));
	}
	mapFalsy<B>(f: (_: A) => B | undefined | null | '' | 0): Maybe<B> {
		return this.chain(a => fromFalsy(f(a)));
	}
	mapNullable<B>(f: (_: A) => B | undefined | null): Maybe<B> {
		return this.chain(a => fromNullable(f(a)));
	}
}

/* === Just === */
export interface Just<A> extends MaybeBase<A> {}
class JustImpl<A> extends MaybeBase<A> {
	constructor(private readonly _value: A) {
		super();
	}
	maybe<B>(_: any, f: (_: A) => B): B {
		return f(this._value);
	}
}
export function Just<A>(value: A): Just<A> {
	return new JustImpl(value);
}

/* === Nothing === */
export interface Nothing extends MaybeBase<never> {}
class NothingImpl extends MaybeBase<never> {
	maybe<B>(f: () => B, _: any) {
		return f();
	}
}
const nothing = new NothingImpl();
export function Nothing(): Nothing {
	return nothing;
}

/* === Static methods === */
export function fromFalsy<A>(falsy: A | undefined | null | '' | 0): Maybe<B> {
	return Boolean(falsy) ? Just(falsy) : Nothing();
}
export function fromNullable<A>(nullable: A | null | undefined): Maybe<A> {
	return nullable == null ? Nothing() : Just(nullable);
}

/* === Maybe === */
export type Maybe<A> = Just<A> | Nothing;
export const Maybe = { Just, Nothing, fromFalsy, fromNullable };
