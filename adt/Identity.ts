import { Applicative, Apply } from './ADT';

export interface Identity<A> {
	constructor: IdentityConstructor;
	value: A;
	ap<B>(that: Identity<(_: A) => B>): Identity<B>;
	chain<B>(f: (_: A) => Identity<B>): Identity<B>;
	map<B>(f: (_: A) => B): Identity<B>;
	reduce<B>(f: (acc: B, _: A) => B, seed: B): B;
	traverse<B>(A: Applicative, f: (_: A) => Apply<B>): Apply<Identity<B>>;
}
interface IdentityConstructor {
	<A>(value: A): Identity<A>;
	new <A>(value: A): Identity<A>;
	chainRec<A, B>(
		f: <C>(next: (_: A) => C, done: (_: B) => C, value: A) => Identity<C>,
		seed: A
	): Identity<B>;
	sequenceA<A>(A: Applicative, identity: Identity<Apply<A>>): Apply<Identity<A>>;
	of<A>(value: A): Identity<A>;
}
export const Identity: IdentityConstructor = function Identity<A>(value: A): Identity<A> {
	const identity = Object.create(Identity.prototype);
	identity.value = value;
	return identity;
} as any;
(Identity.chainRec = function<A, B>(
	f: <C>(next: (_: A) => C, done: (_: B) => C, value: A) => Identity<C>,
	seed: A
): Identity<B> {
	type Result = Next | Done;
	type Next = { isDone: false; next: A };
	type Done = { isDone: true; value: B };
	const next = (next: A): Next => ({ isDone: false, next });
	const done = (value: B): Done => ({ isDone: true, value });
	let value = seed;
	while (true) {
		const result = f<Result>(next, done, value);
		const inner = result.value;
		if (inner.isDone) return Identity(inner.value);
		value = inner.next;
	}
}),
	(Identity.sequenceA = function(_: any, id: any) {
		return id.value.map((x: any) => Identity(x));
	});
Identity.of = function(value: any) {
	return Identity(value);
};
Identity.prototype = {
	constructor: Identity,
	ap(that: any) {
		return this.map(that.value);
	},
	chain(f: Function) {
		return f(this.value);
	},
	map(f: Function) {
		return Identity(f(this.value));
	},
	reduce(f: Function, seed: any) {
		return f(seed, this.value);
	},
	traverse(_: any, f: Function) {
		return f(this.value).map((x: any) => Identity(x));
	},
};
