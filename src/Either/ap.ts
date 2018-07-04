import { Either } from './Either';

export const ap = <L, A, B>(eitherF: Either<L, (_: A) => B>) => (
	eitherA: Either<L, A>
): Either<L, B> =>
	eitherA(
		() => eitherA as any,
		a => eitherF<Either<L, B>>(() => eitherF as any, f => (_, g) => g(f(a)))
	);
