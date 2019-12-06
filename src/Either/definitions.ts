export interface Left<a, b = never> extends PromiseLike<b> {
  isLeft: true;
  isRight: false;
  leftValue: a;
}
export function Left<a, b = never>(leftValue: a): Left<a, b> {
  return { isLeft: true, isRight: false, leftValue, then };

  function then(f: any, g: any): any {
    return Promise.reject(leftValue).then(f, g);
  }
}

export interface Right<b, a = never> extends PromiseLike<b> {
  isLeft: false;
  isRight: true;
  rightValue: b;
}
export function Right<b, a = never>(rightValue: b): Right<b, a> {
  return { isLeft: false, isRight: true, rightValue, then };

  function then(f: any, g: any): any {
    return Promise.resolve(rightValue).then(f, g);
  }
}

export type Either<a, b> = Left<a, b> | Right<b, a>;
