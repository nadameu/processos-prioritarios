/* === Base === */
abstract class TheseBase<A, B> {
	abstract these<C>(f: (_: A) => C, g: (_: B) => C, h: (a: A, b: B) => C): C;

	bimap<C, D>(f: (_: A) => C, g: (_: B) => D): These<C, D> {
		return this.these<These<C, D>>(
			a => This(f(a)),
			b => That(g(b)),
			(a, b) => Both(f(a), g(b))
		);
	}
	isThis(): this is This<A> {
		return this.these(() => true, () => false, () => false);
	}
	isThat(): this is That<B> {
		return this.these(() => false, () => true, () => false);
	}
	isBoth(): this is Both<A, B> {
		return this.these(() => false, () => false, () => true);
	}
	hasThis(): this is This<A> | Both<A, B> {
		return !this.isThat();
	}
	hasThat(): this is That<B> | Both<A, B> {
		return !this.isThis();
	}
	hasBoth(): this is Both<A, B> {
		return this.isBoth();
	}
	mapThis<C>(f: (_: A) => C): These<C, B> {
		return this.these(
			a => This(f(a)),
			() => <any>this,
			(a, b) => Both(f(a), b)
		);
	}
	mapThat<C>(f: (_: B) => C): These<A, C> {
		return this.these(
			() => <any>this,
			b => That(f(b)),
			(a, b) => Both(a, f(b))
		);
	}
}
export interface These<A, B> extends TheseBase<A, B> {}

/* === This === */
class ThisImpl<A> extends TheseBase<A, never> {
	constructor(public readonly thisValue: A) {
		super();
	}

	these<B>(f: (_: A) => B, _g: any, _h: any): B {
		return f(this.thisValue);
	}
}
export interface This<A> extends ThisImpl<A> {}
export function This<A>(value: A): These<A, never> {
	return new ThisImpl(value);
}

/* === That === */
class ThatImpl<B> extends TheseBase<never, B> {
	constructor(public readonly thatValue: B) {
		super();
	}

	these<C>(_f: any, g: (_: B) => C, _h: any): C {
		return g(this.thatValue);
	}
}
export interface That<B> extends ThatImpl<B> {}
export function That<B>(value: B): These<never, B> {
	return new ThatImpl(value);
}

/* === Both === */
class BothImpl<A, B> extends TheseBase<A, B> {
	constructor(public readonly thisValue: A, public readonly thatValue: B) {
		super();
	}

	these<C>(_f: any, _g: any, h: (a: A, b: B) => C): C {
		return h(this.thisValue, this.thatValue);
	}
}
export interface Both<A, B> extends BothImpl<A, B> {}
export function Both<A, B>(a: A, b: B): These<A, B> {
	return new BothImpl(a, b);
}

/* === Static methods === */

/* === Either === */
export const Either = { This, That, Both };
