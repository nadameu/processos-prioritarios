import { Array$traverseObject } from './Array$traverseObject';

export function Array$sequenceObject<T>(objs: T[]) {
  return Array$traverseObject(objs, x => x);
}
