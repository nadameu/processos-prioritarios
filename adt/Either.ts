export abstract class _Either<L, R> {
	abstract isLeft: boolean;
	abstract isRight: boolean;
	abstract either<B>(f: (_: L) => B, g: (_: R) => B): B;

	ap<B>(that: Either<L, (_: R) => B>): Either<L, B> {
		return this.chain(a => that.map(f => f(a)));
	}
	bimap<B, C>(f: (_: L) => B, g: (_: R) => C): Either<B, C> {
		return this.mapLeft(f).map(g);
	}
	chain<B>(f: (_: R) => Either<L, B>): Either<L, B> {
		return this.either(() => (<any>this) as Left<L>, f);
	}
	map<B>(f: (_: R) => B): Either<L, B> {
		return this.chain(a => Right(f(a)));
	}
	mapLeft<B>(f: (_: L) => B): Either<B, R> {
		return this.orElse(a => Left(f(a)));
	}
	orElse<B>(f: (_: L) => Either<B, R>): Either<B, R> {
		return this.either(f, () => (<any>this) as Right<R>);
	}

	static chainRec<L, A, B>(
		f: <C>(next: (_: A) => C, done: (_: B) => C, _: A) => Either<L, C>,
		seed: A
	): Either<L, B> {
		let result = f<Either<A, B>>(Left, Right, seed);
		while (result.isRight) {
			const inner = result.rightValue;
			if (inner.isRight) return inner as Right<B>;
			result = f<Either<A, B>>(Left, Right, inner.leftValue);
		}
		return result as Left<L>;
	}

	static of<L, R>(value: R): Either<L, R> {
		return Right(value);
	}

	static try<A>(f: () => A): Either<Error, A> {
		try {
			return Right(f());
		} catch (e) {
			return Left(e);
		}
	}
}

class _Left<L, R = never> extends _Either<L, R> {
	isLeft: true = true;
	isRight: false = false;
	constructor(public readonly leftValue: L) {
		super();
	}
	either<B>(f: (_: L) => B, _: (_: R) => B): B {
		return f(this.leftValue);
	}
}
export interface Left<L, R = never> extends _Left<L, R> {}
export function Left<L, R = never>(leftValue: L): Left<L, R> {
	return new _Left(leftValue);
}

class _Right<R, L = never> extends _Either<L, R> {
	isLeft: false = false;
	isRight: true = true;
	constructor(public readonly rightValue: R) {
		super();
	}
	either<B>(_: (_: L) => B, g: (_: R) => B): B {
		return g(this.rightValue);
	}
}
export interface Right<R, L = never> extends _Right<R, L> {}
export function Right<R, L = never>(rightValue: R): Right<R, L> {
	return new _Right(rightValue);
}

export type Either<L, R> = Left<L, R> | Right<R, L>;
export const Either = _Either;

declare module './Foldable' {
	interface Foldable<A> {
		traverse<B, L>(A: typeof Either, f: (_: A) => Either<L, B>): Either<L, Foldable<B>>;
	}
	interface FoldableConstructor {
		sequence<L, A>(A: typeof Either, as: Foldable<Either<L, A>>): Either<L, Foldable<A>>;
	}
}

declare module './liftA' {
	export function liftA1<A, B, L>(f: (a: A) => B, fa: Either<L, A>): Either<L, B>;
	export function liftA2<A, B, C, L>(
		f: (a: A, b: B) => C,
		fa: Either<L, A>,
		fb: Either<L, B>
	): Either<L, C>;
	export function liftA3<A, B, C, D, L>(
		f: (a: A, b: B, c: C) => D,
		fa: Either<L, A>,
		fb: Either<L, B>,
		fc: Either<L, C>
	): Either<L, D>;
	export function liftA4<A, B, C, D, E, L>(
		f: (a: A, b: B, c: C, d: D) => E,
		fa: Either<L, A>,
		fb: Either<L, B>,
		fc: Either<L, C>,
		fd: Either<L, D>
	): Either<L, E>;
}
