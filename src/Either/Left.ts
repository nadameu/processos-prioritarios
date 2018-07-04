import { Either } from './Either';

export interface Left<L> extends Either<L, never> {}
export const Left = <L>(value: L): Left<L> => (f, _) => f(value);
