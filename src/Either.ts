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
