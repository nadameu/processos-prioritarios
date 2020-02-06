type Join<T> = (T extends infer U ? (_: U) => any : never) extends (_: infer U) => any ? U : never;

type Result<T> = Join<
  {
    [key in keyof T]-?: T[key] extends undefined ? unknown : T[key];
  }
> extends infer U
  ? {
      [key in keyof U]?: U[key][];
    }
  : never;

export function Array$traverseObject<T, U>(xs: T[], f: (_: T) => U): Result<U> {
  const result: any = {};
  for (const x of xs)
    for (const [key, value] of Object.entries(f(x)))
      (result[key] || (result[key] = [])).push(value);
  return result;
}
