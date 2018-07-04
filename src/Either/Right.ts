import { Either } from './Either';

export interface Right<R> extends Either<never, R> {}
export const Right = <R>(value: R): Right<R> => (_, f) => f(value);
