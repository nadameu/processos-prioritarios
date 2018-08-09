import { Applicative, Apply } from './ADT';

class IdentityBase<A> {
	value!: A;
	ap<B>(that: Identity<(_: A) => B>): Identity<B> {
		return this.map(that.value);
	}
	chain<B>(f: (_: A) => Identity<B>): Identity<B> {
		return f(this.value);
	}
	map<B>(f: (_: A) => B): Identity<B> {
		return Identity(f(this.value));
	}
	reduce<B>(f: (acc: B, _: A) => B, seed: B): B {
		return f(seed, this.value);
	}
	traverse<B>(A: Applicative, f: (_: A) => Apply<B>): Apply<Identity<B>> {
		return f(this.value).ap<Identity<B>>(A.of(Identity.of));
	}
}
const Static = {
	chainRec<A, B>(
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
	},
	of<A>(value: A): Identity<A> {
		return Identity(value);
	},
};
export interface Identity<A> extends IdentityBase<A> {
	constructor: IdentityConstructor;
}
type C = typeof Static;
interface IdentityConstructor extends C {
	<A>(value: A): Identity<A>;
	new <A>(value: A): Identity<A>;
}
export const Identity: IdentityConstructor = Object.assign(
	function Identity<A>(value: A): Identity<A> {
		const identity = Object.create(Identity.prototype);
		identity.value = value;
		return identity;
	} as any,
	{ prototype: Object.create(IdentityBase.prototype) },
	Static
);
Identity.prototype.constructor = Identity;

export function sequenceA<A>(A: Applicative, identity: Identity<Apply<A>>): Apply<Identity<A>> {
	return identity.traverse(A, x => x);
}
