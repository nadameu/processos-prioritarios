abstract class Either$abstract<L, R> {
	abstract isLeft: boolean;
	abstract isRight: boolean;
	abstract either<B>(f: (_: L) => B, g: (_: R) => B): B;

	alt(that: Either<L, R>): Either<L, R> {
		return this.either(() => that, () => (<any>this) as Right<R>);
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
	chainLeft<B>(f: (_: L) => Either<B, R>): Either<B, R> {
		return this.either(f, () => (<any>this) as Right<R>);
	}
	map<B>(f: (_: R) => B): Either<L, B> {
		return this.chain(a => Right(f(a)));
	}
	mapLeft<B>(f: (_: L) => B): Either<B, R> {
		return this.chainLeft(a => Left(f(a)));
	}
}
const Either$static = {
	chainRec<L, A, B>(
		f: <C>(next: (_: A) => C, done: (_: B) => C, _: A) => Either<L, C>,
		seed: A
	): Either<L, B> {
		let value = seed;
		while (true) {
			const result = f<Either<A, B>>(Left, Right, value);
			if (result.isLeft) return result as Left<L>;
			const inner = result.rightValue;
			if (inner.isRight) return inner as Right<B>;
			value = inner.leftValue;
		}
	},

	of<L, R>(value: R): Either<L, R> {
		return Right(value);
	},

	try<A>(f: () => A): Either<Error, A> {
		try {
			return Right(f());
		} catch (e) {
			return Left(e);
		}
	},
};
type Either$static = typeof Either$static;
interface EitherConstructor extends Either$static {}

export interface Left<L, R = never> extends Either$abstract<L, R> {
	constructor: LeftConstructor;
	isLeft: true;
	isRight: false;
	leftValue: L;
}
interface LeftConstructor extends EitherConstructor {
	new <L, R = never>(leftValue: L): Left<L, R>;
	<L, R = never>(leftValue: L): Left<L, R>;
}
export const Left: LeftConstructor = Object.assign(function Left<L, R = never>(
	leftValue: L
): Left<L, R> {
	const ret = Object.create(Left.prototype);
	ret.isLeft = true;
	ret.leftValue = leftValue;
	return ret;
},
Either$static) as any;
Left.prototype = Object.create(Either$abstract.prototype);
Left.prototype.constructor = Left;
Left.prototype.isRight = false;
Left.prototype.either = function<B, L, R>(this: Left<L, R>, f: (_: L) => B, _: any): B {
	return f(this.leftValue);
};

export interface Right<R, L = never> extends Either$abstract<L, R> {
	constructor: RightConstructor;
	isLeft: false;
	isRight: true;
	rightValue: R;
}
interface RightConstructor extends EitherConstructor {
	new <R, L = never>(rightValue: R): Right<R, L>;
	<R, L = never>(rightValue: R): Right<R, L>;
}
export const Right: RightConstructor = Object.assign(function Right<R, L = never>(
	rightValue: R
): Right<R, L> {
	const ret = Object.create(Right.prototype);
	ret.isLeft = false;
	ret.rightValue = rightValue;
	return ret;
},
Either$static) as any;
Right.prototype = Object.create(Either$abstract.prototype);
Right.prototype.constructor = Right;
Right.prototype.isRight = true;
Right.prototype.either = function<B, R, L>(this: Right<R, L>, _: any, f: (_: R) => B): B {
	return f(this.rightValue);
};

export type Either<L, R> = Left<L, R> | Right<R, L>;
export const Either: EitherConstructor = Object.assign(Either$abstract, Either$static) as any;

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
