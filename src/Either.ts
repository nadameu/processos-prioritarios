export type Either<a, b> = Left<a, b> | Right<b, a>;

export interface Left<a, b = never> {
  isLeft: true;
  isRight: false;
  leftValue: a;
  chain<c>(f: (_: b) => Either<a, c>): Either<a, c>;
  map<c>(f: (_: b) => c): Either<a, c>;
  then(f: (_: b) => void, g: (_: a) => void): void;
}
export function Left<a, b = never>(leftValue: a): Left<a, b> {
  const left = Object.create(Left.prototype);
  left.leftValue = leftValue;
  return left;
}
Left.prototype.isLeft = true;
Left.prototype.isRight = false;
Left.prototype.chain = function chain<a, b, c>(
  this: Left<a, b>,
  _: (_: b) => Either<a, c>
): Either<a, c> {
  return this as Left<a>;
};
Left.prototype.map = Left.prototype.chain;
Left.prototype.then = function then<a, b>(
  this: Left<a, b>,
  _: (_: b) => void,
  g: (_: a) => void
): void {
  g(this.leftValue);
};

export interface Right<b, a = never> {
  isLeft: false;
  isRight: true;
  rightValue: b;
  chain<c>(f: (_: b) => Either<a, c>): Either<a, c>;
  map<c>(f: (_: b) => c): Either<a, c>;
  then(f: (_: b) => void, g: (_: a) => void): void;
}
export function Right<b, a = never>(rightValue: b): Right<b, a> {
  const right = Object.create(Right.prototype);
  right.rightValue = rightValue;
  return right;
}
Right.prototype.isLeft = false;
Right.prototype.isRight = true;
Right.prototype.chain = function chain<a, b, c>(
  this: Right<b, a>,
  f: (_: b) => Either<a, c>
): Either<a, c> {
  return f(this.rightValue);
};
Right.prototype.map = function map<a, b, c>(this: Right<b, a>, f: (_: b) => c): Either<a, c> {
  return Right(f(this.rightValue));
};
Right.prototype.then = function then<a, b>(
  this: Right<b, a>,
  f: (_: b) => void,
  _: (_: a) => void
): void {
  f(this.rightValue);
};

export function partition<a, b>(eithers: Either<a, b>[]): { left: a[]; right: b[] } {
  const left: a[] = [];
  const right: b[] = [];
  for (const either of eithers)
    if (either.isLeft) left.push(either.leftValue);
    else right.push(either.rightValue);
  return { left, right };
}

export function sequenceEithers<a, b, c, d, e, f>(
  eithers: [Either<a, b>, Either<a, c>, Either<a, d>, Either<a, e>, Either<a, f>]
): Either<a, [b, c, d, e, f]>;
export function sequenceEithers<a, b, c, d, e>(
  eithers: [Either<a, b>, Either<a, c>, Either<a, d>, Either<a, e>]
): Either<a, [b, c, d, e]>;
export function sequenceEithers<a, b, c, d>(
  eithers: [Either<a, b>, Either<a, c>, Either<a, d>]
): Either<a, [b, c, d]>;
export function sequenceEithers<a, b, c>(eithers: [Either<a, b>, Either<a, c>]): Either<a, [b, c]>;
export function sequenceEithers<a, b>(eithers: Either<a, b>[]): Either<a, b[]>;
export function sequenceEithers<a, b>(eithers: Either<a, b>[]): Either<a, b[]> {
  const rights: b[] = [];
  for (const either of eithers)
    if (either.isLeft) return either as Left<a>;
    else rights.push(either.rightValue);
  return Right(rights);
}

export function sequenceValidations<a, b, c, d, e, f>(
  validations: [Either<a, b>, Either<a, c>, Either<a, d>, Either<a, e>, Either<a, f>]
): Either<a[], [b, c, d, e, f]>;
export function sequenceValidations<a, b, c, d, e>(
  validations: [Either<a, b>, Either<a, c>, Either<a, d>, Either<a, e>]
): Either<a[], [b, c, d, e]>;
export function sequenceValidations<a, b, c, d>(
  validations: [Either<a, b>, Either<a, c>, Either<a, d>]
): Either<a[], [b, c, d]>;
export function sequenceValidations<a, b, c>(
  validations: [Either<a, b>, Either<a, c>]
): Either<a[], [b, c]>;
export function sequenceValidations<a, b>(validations: Either<a, b>[]): Either<a[], b[]>;
export function sequenceValidations<a, b>(validations: Either<a, b>[]): Either<a[], b[]> {
  const { left, right } = partition(validations);
  if (left.length > 0) return Left(left);
  else return Right(right);
}

export function sequenceValidationsObject<T extends { [key: string]: Either<a, unknown> }, a>(
  obj: T
): Either<
  { [key in keyof T]?: a },
  { [key in keyof T]: T[key] extends Either<a, infer b> ? b : never }
> {
  let hasErrors = false;
  const left = {} as any;
  const right = {} as any;
  for (const [key, either] of Object.entries(obj))
    if (either.isLeft) {
      hasErrors = true;
      left[key] = either.leftValue;
    } else right[key] = either.rightValue;
  if (hasErrors) return Left(left);
  return Right(right);
}
