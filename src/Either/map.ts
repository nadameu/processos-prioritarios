import { Either } from './Either';

export const map = <L, A, B>(f: (_: A) => B) => (
	either: Either<L, A>
): Either<L, B> => either(() => either as any, a => (_, g) => g(f(a)));
