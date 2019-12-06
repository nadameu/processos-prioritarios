export * from './definitions';
import { fromMaybe, fromNullable, map, maybe, maybeL } from './functions';
export type Maybe<a> = import('./definitions').Maybe<a>;
export namespace Maybe {
  export { fromMaybe, fromNullable, map, maybe, maybeL };
}
