import { Apply } from './ADT';

type Nullable<A> = A | null | undefined;
export abstract class Either<L, R> implements Apply<Either<L, any>, R> {
	abstract either<B>(f: (_: L) => B, g: (_: R) => B): B;

	ap<B>(that: Either<L, (_: R) => B>): Either<L, B> {
		return this.chain(a => that.map(f => f(a)));
	}
	chain<B>(f: (_: R) => Either<L, B>): Either<L, B> {
		return this.either(() => (<any>this) as Either<L, never>, f);
	}
	isLeft(): this is Left<L> {
		return this.either(() => true, () => false);
	}
	isRight(): this is Right<R> {
		return this.either(() => false, () => true);
	}
	map<B>(f: (_: R) => B): Either<L, B> {
		return this.chain(a => right(f(a)));
	}
	orElse<B>(f: (_: L) => Either<B, R>): Either<B, R> {
		return this.either(f, () => (<any>this) as Right<R>);
	}

	static Left<L>(value: L): Left<L> {
		return new Left(value);
	}
	static Right<R>(value: R): Right<R> {
		return new Right(value);
	}

	static fromNullable<A>(value: Nullable<A>): Either<null | undefined, A> {
		return value == null ? left(value) : right(value);
	}
	static of<L, R>(value: R): Either<L, R> {
		return new Right(value);
	}
}

export class Left<L> extends Either<L, never> {
	constructor(public readonly leftValue: L) {
		super();
	}
	either(f: Function) {
		return f(this.leftValue);
	}
}
export const left = Either.Left;

export class Right<R> extends Either<never, R> {
	constructor(public readonly rightValue: R) {
		super();
	}
	either(_: any, g: Function) {
		return g(this.rightValue);
	}
}
export const right = Either.Right;

declare module './Iter' {
	interface Iter<A> {
		sequence<F, L, R>(
			this: Iter<Either<L, R>>,
			A: typeof Either
		): Either<L, Iter<R>>;
		traverse<L, B>(
			A: typeof Either,
			f: (_: A) => Either<L, B>
		): Either<L, Iter<B>>;
	}
}

declare module './liftA' {
	export function liftA3<L, A, B, C, D>(
		f: (a: A, b: B, c: C) => D,
		fa: Either<L, A>,
		fb: Either<L, B>,
		fc: Either<L, C>
	): Either<L, D>;
	export function liftA4<L, A, B, C, D, E>(
		f: (a: A, b: B, c: C, d: D) => E,
		fa: Either<L, A>,
		fb: Either<L, B>,
		fc: Either<L, C>,
		fd: Either<L, D>
	): Either<L, E>;
}
