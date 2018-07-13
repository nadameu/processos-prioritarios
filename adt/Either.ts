interface ILeft<L> {
	isLeft: true;
	leftValue: L;
}
interface IRight<R> {
	isLeft: false;
	rightValue: R;
}
type IEither<L, R> = ILeft<L> | IRight<R>;

export class EitherImpl<L, R> {
	isLeft: boolean;
	isRight: boolean;
	either: <B>(f: (_: L) => B, g: (_: R) => B) => B;
	constructor(either: IEither<L, R>) {
		this.isLeft = either.isLeft;
		this.isRight = !either.isLeft;
		this.either = either.isLeft
			? f => f(either.leftValue)
			: (_, g) => g(either.rightValue);
	}

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

class LeftImpl<L, R = never> extends EitherImpl<L, R> {
	isLeft: true = true;
	isRight: false = false;
	constructor(public readonly leftValue: L) {
		super({ isLeft: true, leftValue });
	}
}
export interface Left<L, R = never> extends LeftImpl<L, R> {}
export function Left<L, R = never>(leftValue: L): Left<L, R> {
	return new LeftImpl(leftValue);
}

class RightImpl<R, L = never> extends EitherImpl<L, R> {
	isLeft: false = false;
	isRight: true = true;
	constructor(public readonly rightValue: R) {
		super({ isLeft: false, rightValue });
	}
}
export interface Right<R, L = never> extends RightImpl<R, L> {}
export function Right<R, L = never>(rightValue: R): Right<R, L> {
	return new RightImpl(rightValue);
}

export type Either<L, R> = Left<L, R> | Right<R, L>;
export const Either = EitherImpl;

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
	export function liftA2<L, A, B, C>(
		f: (a: A, b: B) => C,
		fa: Either<L, A>,
		fb: Either<L, B>
	): Either<L, C>;
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
