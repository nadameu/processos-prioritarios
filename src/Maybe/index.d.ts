import { Maybe as MaybeType } from './defs';
export { Just, Nothing } from './defs';
export type Maybe<a> = MaybeType<a>;

import { fromNullable, lift2, of } from './functions';
export namespace Maybe {
  export { fromNullable, lift2, of };
}
