// From remedajs.com
type Purried<args, ret> = args extends [infer a, infer b]
  ? { (b: b): (a: a) => ret; (...args: args): ret }
  : args extends [infer a, infer b, infer c]
  ? { (b: b, c: c): (a: a) => ret; (...args: args): ret }
  : { (...args: any[]): never };

export function purry<args extends unknown[], ret>(f: (...args: args) => ret): Purried<args, ret>;
// eslint-disable-next-line @typescript-eslint/ban-types
export function purry(f: Function) {
  return function purry(...args: any[]) {
    return f.length - args.length === 1
      ? function purry(obj: any) {
          return f(obj, ...args);
        }
      : f(...args);
  };
}
