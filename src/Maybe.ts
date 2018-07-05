/* === Base === */
abstract class MaybeBase<A> {
	isMaybe = true;
	abstract isJust: boolean;
	abstract isNothing: boolean;

	abstract maybe<B>(f: () => B, g: (_: A) => B): B;

	ap<B>(that: MaybeBase<(_: A) => B>): Maybe<B> {
		return this.chain(a => that.map(f => f(a)));
	}
	chain<B>(f: (_: A) => Maybe<B>): Maybe<B> {
		return this.maybe(() => <any>this, f);
	}
	getOrElse(a: A): A {
		return this.maybe(() => a, a => a);
	}
	map<B>(f: (_: A) => B): Maybe<B> {
		return this.maybe(() => <any>this, a => Just(f(a)));
	}
	mapFalsy<B>(f: (_: A) => B | undefined | null | '' | 0): Maybe<B> {
		return this.chain(a => fromFalsy(f(a)));
	}
	mapNullable<B>(f: (_: A) => B | undefined | null): Maybe<B> {
		return this.chain(a => fromNullable(f(a)));
	}
	orElse(f: () => Maybe<A>): Maybe<A> {
		return this.maybe(f, () => <any>this);
	}
}
export interface Maybe<A> extends MaybeBase<A> {}

/* === Just === */
class JustImpl<A> extends MaybeBase<A> {
	isJust = true;
	isNothing = false;

	constructor(private readonly _value: A) {
		super();
	}

	maybe<B>(_: any, f: (_: A) => B): B {
		return f(this._value);
	}
}
export interface Just<A> extends JustImpl<A> {}
export function Just<A>(value: A): Just<A> {
	return new JustImpl(value);
}

/* === Nothing === */
class NothingImpl extends MaybeBase<never> {
	isJust = false;
	isNothing = true;

	maybe<B>(f: () => B, _: any) {
		return f();
	}
}
export interface Nothing extends NothingImpl {}
export function Nothing(): Nothing {
	return new NothingImpl();
}

/* === Static methods === */
export function fromFalsy<A>(falsy: A | undefined | null | '' | 0): Maybe<A> {
	return Boolean(falsy) ? Just(<A>falsy) : Nothing();
}
export function fromNullable<A>(nullable: A | null | undefined): Maybe<A> {
	return nullable == null ? Nothing() : Just(nullable);
}
export function of<A>(value: A): Maybe<A> {
	return Just(value);
}

/* === Maybe === */
export const Maybe = { Just, Nothing, fromFalsy, fromNullable, of };
