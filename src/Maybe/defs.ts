export type Maybe<a> = Just<a> | Nothing<a>;

interface MaybeBase<a> {
  chain<b>(f: (_: a) => Maybe<b>): Maybe<b>;
  map<b>(f: (_: a) => b): Maybe<b>;
}

export interface Just<a> extends MaybeBase<a> {
  isJust: true;
  isNothing: false;
  value: a;
}
export function Just<a>(value: a): Just<a> {
  return {
    isJust: true,
    isNothing: false,
    value,

    chain,
    map
  };

  function chain<b>(f: (_: a) => Maybe<b>): Maybe<b> {
    return f(value);
  }

  function map<b>(f: (_: a) => b): Maybe<b> {
    return Just(f(value));
  }
}

export interface Nothing<a = never> extends MaybeBase<a> {
  isJust: false;
  isNothing: true;
}
export const Nothing: Nothing = /*@__PURE__*/ (() => {
  return {
    isJust: false as const,
    isNothing: true as const,

    chain: returnNothing,
    map: returnNothing
  };

  function returnNothing<a>(_: (_: never) => a | Maybe<a>): Maybe<a> {
    return Nothing;
  }
})();
