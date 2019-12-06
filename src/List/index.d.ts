export * from './definitions';
import { drop, filter, fromArray, fromIterable, index, map, toArray } from './functions';
export type List<a> = import('./definitions').List<a>;
export namespace List {
  export { drop, filter, fromArray, fromIterable, index, map, toArray };
}
