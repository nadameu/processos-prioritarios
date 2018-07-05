/* === Base === */
abstract class EitherBase<L, R> {
	isEither = true;
	abstract isLeft: boolean;
	abstract isRight: boolean;

	abstract either<B>(f: (_: L) => B, g: (_: R) => B): B;

	ap<B>(that: EitherBase<L, (_: R) => B>): Either<L, B> {
		return this.chain(a => that.map(f => f(a)));
	}
	bimap<B, C>(f: (_: L) => B, g: (_: R) => C): Either<B, C> {
		return this.mapLeft(f).map(g);
	}
	chain<B>(f: (_: R) => Either<L, B>): Either<L, B> {
		return this.either<Either<L, B>>(() => <any>this, f);
	}
	getOrElse(r: R): R {
		return this.either(() => r, r => r);
	}
	map<B>(f: (_: R) => B): Either<L, B> {
		return this.chain(a => Right(f(a)));
	}
	mapLeft<B>(f: (_: L) => B): Either<B, R> {
		return this.orElse(l => Left(f(l)));
	}
	orElse<B>(f: (_: L) => Either<B, R>): Either<B, R> {
		return this.either<Either<B, R>>(f, () => <any>this);
	}
}
export interface Either<L, R> extends EitherBase<L, R> {}

/* === Left === */
class LeftImpl<L> extends EitherBase<L, never> {
	isLeft = true;
	isRight = false;

	constructor(private readonly _value: L) {
		super();
	}

	either<B>(f: (_: L) => B, _: any): B {
		return f(this._value);
	}
}
export interface Left<L> extends LeftImpl<L> {}
export function Left<L>(value: L): Left<L> {
	return new LeftImpl(value);
}

/* === Right === */
class RightImpl<R> extends EitherBase<never, R> {
	isLeft = false;
	isRight = true;

	constructor(private readonly _value: R) {
		super();
	}

	either<B>(_: any, f: (_: R) => B): B {
		return f(this._value);
	}
}
export interface Right<R> extends RightImpl<R> {}
export function Right<R>(value: R): Right<R> {
	return new RightImpl(value);
}

/* === Static methods === */
export function fromThrowable<L, R>(
	f: (_: Error) => L,
	g: () => R
): Either<L, R> {
	try {
		return Right(g());
	} catch (e) {
		return Left(f(e));
	}
}

export function of<L, R>(value: R): Either<L, R> {
	return Right(value);
}

/* === Either === */
export const Either = { Left, Right, fromThrowable, of };
