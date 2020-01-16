import { Either, Left, Right } from '../Either';

interface MaybeBase<a> {
  note<e>(leftValue: e): Either<e, a>;
  then(f: (_: a) => void, g: () => void): void;
}

export interface Just<a> extends MaybeBase<a> {
  isJust: true;
  isNothing: false;
  value: a;
}
export function Just<a>(value: a): Just<a> {
  const just = Object.create(Just.prototype);
  just.value = value;
  return just;
}
(Just as { prototype: Just<any> & { constructor: typeof Just } }).prototype = {
  constructor: Just,
  isNothing: false,
  isJust: true,
  value: undefined,
  note(_) {
    return Right(this.value);
  },
  then(f) {
    f(this.value);
  },
};

export interface Nothing<a = never> extends MaybeBase<a> {
  isJust: false;
  isNothing: true;
}
const Nothing$constructor = function Nothing(): Nothing {
  return Object.create(Nothing$constructor.prototype);
};
(Nothing$constructor as {
  prototype: Nothing & { constructor: typeof Nothing$constructor };
}).prototype = {
  constructor: Nothing$constructor,
  isJust: false,
  isNothing: true,
  note(l) {
    return Left(l);
  },
  then(_, g) {
    g();
  },
};
export const Nothing = Nothing$constructor();

export type Maybe<a> = Just<a> | Nothing;
