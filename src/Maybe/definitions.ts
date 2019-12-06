export interface Just<a> extends PromiseLike<a> {
  isJust: true;
  isNothing: false;
  value: a;
}
export function Just<a>(value: a): Just<a> {
  const just = Object.create(Just.prototype);
  just.value = value;
  return just;
}
Just.prototype = {
  constructor: Just,
  isNothing: false,
  isJust: true,
  then(this: Just<any>, f?: any) {
    return f ? f(this.value) : this;
  },
};

export interface Nothing<a = never> extends PromiseLike<a> {
  isJust: false;
  isNothing: true;
}
const Nothing$constructor = function Nothing(): Nothing {
  return Object.create(Nothing$constructor.prototype);
};
Nothing$constructor.prototype = {
  constructor: Nothing$constructor,
  isJust: false,
  isNothing: true,
  then(_?: any, g?: any) {
    return g ? g() : this;
  },
};
export const Nothing = Nothing$constructor();

export type Maybe<a> = Just<a> | Nothing;
