import { Either } from './Either';

export const chain = <L, A, B>(f: (_: A) => Either<L, B>) => (
	either: Either<L, A>
): Either<L, B> => either(() => either as any, f);
