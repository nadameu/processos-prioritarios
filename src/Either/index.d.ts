export * from './definitions';
import { map, note } from './functions';

export type Either<a, b> = import('./definitions').Either<a, b>;
export namespace Either {
  export { map, note };
}
