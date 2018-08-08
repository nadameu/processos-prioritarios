interface Applicative {
	of<A>(_: A): Apply<A>;
}
interface Apply<A> {
	ap<B>(that: Apply<(_: A) => B>): Apply<B>;
	map<B>(f: (_: A) => B): Apply<B>;
}
interface IMaybe<A> {
	constructor: MaybeConstructor;
	isNothing: boolean;
	alt(that: Maybe<A>): Maybe<A>;
	ap<B>(that: Maybe<(_: A) => B>): Maybe<B>;
	chain<B>(f: (_: A) => Maybe<B>): Maybe<B>;
	filter<B extends A>(p: (value: A) => value is B): Maybe<B>;
	filter(p: (_: A) => boolean): Maybe<A>;
	getOrElse(defaultValue: A): A;
	map<B>(f: (_: A) => B): Maybe<B>;
	reduce<B>(f: (acc: B, _: A) => B, seed: B): B;
	traverse<B>(A: Applicative, f: (_: A) => Apply<B>): Apply<Maybe<B>>;
}
export interface Just<A> extends IMaybe<A> {
	constructor: JustConstructor;
	isJust: true;
	isNothing: false;
	value: A;
}
export interface Nothing<A = never> extends IMaybe<A> {
	constructor: MaybeConstructor;
	isJust: false;
	isNothing: true;
}

interface MaybeConstructor {
	prototype: Maybe<any>;
	chainRec<A, B>(
		f: <C>(next: (_: A) => C, done: (_: B) => C, value: A) => Maybe<C>,
		seed: A
	): Maybe<B>;
	fromNullable<A>(value: A | null | undefined): Maybe<A>;
	of<A>(value: A): Maybe<A>;
	sequenceA<A>(A: Applicative, maybe: Maybe<Apply<A>>): Apply<Maybe<A>>;
	zero<A = never>(): Maybe<A>;
}
interface JustConstructor extends MaybeConstructor {
	prototype: Just<any>;
	<A>(value: A): Just<A>;
	new <A>(value: A): Just<A>;
}

const Maybe$static = {
	chainRec<A, B>(
		f: <C>(next: (_: A) => C, done: (_: B) => C, value: A) => Maybe<C>,
		seed: A
	): Maybe<B> {
		type Result = Next | Done;
		type Next = { isDone: false; next: A };
		type Done = { isDone: true; value: B };
		const next = (next: A): Next => ({ isDone: false, next });
		const done = (value: B): Done => ({ isDone: true, value });
		let value = seed;
		while (true) {
			const result = f<Result>(next, done, value);
			if (result.isNothing) return Nothing;
			const inner = result.value;
			if (inner.isDone) return Just(inner.value);
			value = inner.next;
		}
	},
	fromNullable(value: any) {
		return value == null ? Nothing : Just(value);
	},
	of<A>(value: A): Just<A> {
		return Just(value);
	},
	sequenceA<A>(A: Applicative, maybe: Maybe<Apply<A>>) {
		return maybe.isNothing
			? A.of(Nothing as Maybe<A>)
			: maybe.value.map(x => Just(x));
	},
	zero() {
		return Nothing;
	},
};
export const Maybe: MaybeConstructor = Object.assign(function Maybe() {},
Maybe$static);
export const Just: JustConstructor = Object.assign(function Just<A>(
	value: A
): Just<A> {
	return Object.assign(Object.create(Just.prototype), {
		isNothing: false,
		value,
	});
},
Maybe$static) as any;
const Just$prototype = {
	constructor: Just,
	isJust: true,
	alt() {
		return this;
	},
	ap(this: Just<any>, that: Maybe<any>) {
		return that.isNothing ? that : this.map(that.value);
	},
	chain(this: Just<any>, f: Function) {
		return f(this.value);
	},
	filter(this: Just<any>, p: Function) {
		return p(this.value) ? this : Nothing;
	},
	getOrElse(this: Just<any>) {
		return this.value;
	},
	map(this: Just<any>, f: Function) {
		return Just(f(this.value));
	},
	reduce(this: Just<any>, f: Function, seed: any) {
		return f(seed, this.value);
	},
	traverse<A, B>(
		this: Just<A>,
		_: Applicative,
		f: (_: A) => Apply<B>
	): Apply<Maybe<B>> {
		return f(this.value).map(b => Just(b));
	},
};
Just.prototype = Object.assign(Object.create(Maybe.prototype), Just$prototype);

export const Nothing: Nothing = (function() {
	const Nothing = Object.assign(function Nothing<A = never>(): Nothing<A> {
		return Object.assign(Object.create(Nothing.prototype), {
			isNothing: true,
		});
	}, Maybe$static);
	const Nothing$prototype = {
		constructor: Nothing,
		isJust: false,
		alt(that: any) {
			return that;
		},
		ap() {
			return this;
		},
		chain() {
			return this;
		},
		filter() {
			return this;
		},
		getOrElse(defaultValue: any) {
			return defaultValue;
		},
		map() {
			return this;
		},
		reduce(_: Function, seed: any) {
			return seed;
		},
		traverse(A: Applicative) {
			return A.of(this);
		},
	};
	Nothing.prototype = Object.assign(
		Object.create(Maybe.prototype),
		Nothing$prototype
	);
	return Nothing();
})();
export type Maybe<A> = Just<A> | Nothing<A>;
