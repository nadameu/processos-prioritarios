/* eslint-disable prefer-arrow-callback */

import { purry } from '../purry';
import { Either, Right, Left } from './definitions';
import { Maybe } from '../Maybe';

export const map = purry(function map<a, b, c>(either: Either<a, b>, f: (_: b) => c): Either<a, c> {
  return either.isLeft ? (either as Left<a>) : Right(f(either.rightValue));
}) as {
  <b, c>(f: (_: b) => c): <a>(either: Either<a, b>) => Either<a, c>;
  <a, b, c>(either: Either<a, b>, f: (_: b) => c): Either<a, c>;
};

export const note = purry(function note<a, b>(maybe: Maybe<b>, note: a): Either<a, b> {
  return Maybe.maybeL(maybe, () => Left<a, b>(note), Right as (_: b) => Either<a, b>);
}) as {
  <a>(note: a): <b>(maybe: Maybe<b>) => Either<a, b>;
  <a, b>(maybe: Maybe<b>, note: a): Either<a, b>;
};
