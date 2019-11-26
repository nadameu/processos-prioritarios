class Constructor<A> {
  map<B>(f: (_: A) => B): Maybe<B>;
  map<B>(this: Just<A> | Nothing, f: (_: A) => B): Maybe<B> {
    return this.isNothing ? this : Just(f(this.value));
  }
}
const Static = {
  of<A>(value: A): Maybe<A> {
    return Just(value);
  },
  zero<A = never>(): Maybe<A> {
    return Nothing;
  }
};
export interface IMaybe<A> extends Constructor<A> {
  constructor: MaybeConstructor;
}
export type Maybe<A> = Just<A> | Nothing<A>;
export interface Just<A> extends IMaybe<A> {
  constructor: JustConstructor;
  isJust: true;
  isNothing: false;
  value: A;
}
export interface Nothing<A = never> extends IMaybe<A> {
  isJust: false;
  isNothing: true;
}
type Id<A> = A;
export type MaybeConstructor = Id<typeof Static>;
export interface JustConstructor extends MaybeConstructor {
  <A>(value: A): Just<A>;
  new <A>(value: A): Just<A>;
}

export const Just: JustConstructor = (function() {
  const prototype = Object.assign(Object.create(Constructor.prototype), {
    isJust: true
  });
  const Just = Object.assign(
    (value: A): Just<A> => {
      return Object.assign(Object.create(prototype), { isNothing: false, value });
    },
    { prototype },
    Static
  ) as any;
  Just.prototype.constructor = Just;
  return Just;
})();

export const Nothing: Nothing = (function() {
  const prototype = Object.assign(Object.create(Constructor.prototype), {
    isJust: false
  });
  const Nothing = Object.assign(
    A> => {
      return nothing;
    },
    { prototype },
    Static
  );
  Nothing.prototype.constructor = Nothing;
  const nothing = Object.assign(Object.create(prototype), { isNothing: true });
  return nothing;
})();
