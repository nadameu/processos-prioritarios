export interface Left<a> extends PromiseLike<never> {
  isLeft: true;
  isRight: false;
  leftValue: a;
}
export function Left<a>(leftValue: a): Left<a> {
  return {
    isLeft: true,
    isRight: false,
    leftValue,
    then: makeThen('reject', leftValue),
  };
}

export interface Right<b> extends PromiseLike<b> {
  isLeft: false;
  isRight: true;
  rightValue: b;
}
export function Right<b>(rightValue: b): Right<b> {
  return {
    isLeft: false,
    isRight: true,
    rightValue,
    then: makeThen('resolve', rightValue),
  };
}

function makeThen<a>(type: 'resolve', value: a): Promise<a>['then'];
function makeThen<a>(type: 'reject', value: a): Promise<never>['then'];
function makeThen<k extends 'resolve' | 'reject', a>(type: k, value: a) {
  return (f: any, g: any) => (Promise as any)[type](value).then(f, g);
}

export type Either<a, b> = Left<a> | Right<b>;

export const either: {
  <a, c>(f: (_: a) => c): <b>(g: (_: b) => c) => (fx: Either<a, b>) => c;
  <a, b, c>(f: (_: a) => c, g: (_: b) => c): (fx: Either<a, b>) => c;
  <a, b, c>(f: (_: a) => c, g: (_: b) => c, fx: Either<a, b>): c;
} = (f: (_: any) => any, g?: (_: any) => any, fx?: any) => {
  if (g === undefined) return (g: (_: any) => any, fx?: any) => either(f, g, fx);
  if (fx === undefined) return (fx: any) => either(f, g, fx);
  return fx.isLeft ? f(fx.leftValue) : g(fx.rightValue);
};

const chainEither: <a, b, c>(
  f: (_: b) => Either<a, c>
) => (fx: Either<a, b>) => Either<a, c> = either(Left as <a>(_: a) => Either<a, any>);

const mapEither = <b, c>(f: (_: b) => c): (<a>(fx: Either<a, b>) => Either<a, c>) =>
  chainEither(x => Right(f(x)));

const ap_: <a, b>(fx: Either<a, b>) => <c>(ff: Either<a, (_: b) => c>) => Either<a, c> = fx =>
  chainEither(f => mapEither(f)(fx));

const apEither: <a, b, c>(
  ff: Either<a, (_: b) => c>
) => (fx: Either<a, b>) => Either<a, c> = ff => fx => ap_(fx)(ff);

export { chainEither as chain, mapEither as map, apEither as ap };
