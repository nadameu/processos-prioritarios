export type Either<a, b> = Left<a> | Right<b>;

export interface Left<a> {
  isLeft: true;
  isRight: false;
  leftValue: a;
}
export function Left<a>(leftValue: a): Left<a> {
  const left = Object.create(Left.prototype);
  left.leftValue = leftValue;
  return left;
}
Left.prototype.isLeft = true;
Left.prototype.isRight = false;

export interface Right<b> {
  isLeft: false;
  isRight: true;
  rightValue: b;
}
export function Right<b>(rightValue: b): Right<b> {
  const right = Object.create(Right.prototype);
  right.rightValue = rightValue;
  return right;
}
Right.prototype.isLeft = false;
Right.prototype.isRight = true;

export function note<a, b>(leftValue: a, maybe: b | null | undefined): Either<a, b> {
  return maybe != null ? Right(maybe) : Left(leftValue);
}

export function hush<a, b>(either: Either<a, b>): b | null {
  return either.isLeft ? null : either.rightValue;
}
