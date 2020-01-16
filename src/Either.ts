import { Right } from 'adt-ts';
export { E, either, Left, Right } from 'adt-ts';

export type Either<a, b> = import('adt-ts').Either<a, b>;

type SequenceResult<T> = Either<
  T extends Record<keyof T, Either<infer a, any>> ? a : never,
  {
    [key in keyof T]: T[key] extends Either<any, infer b> ? b : never;
  }
>;
export function sequenceObject<T extends Record<keyof T, Either<any, any>>>(
  obj: T
): SequenceResult<T> {
  const values: any = {};
  for (const [key, either] of Object.entries(obj as Record<string, Either<any, any>>))
    if (either.isLeft) return either;
    else values[key] = either.rightValue;
  return Right(values);
}
