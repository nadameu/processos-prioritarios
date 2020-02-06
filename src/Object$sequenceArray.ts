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
export function Object$sequenceArray<T>(objs: T[]): Result<T> {
  const result: any = {};
  for (const obj of objs)
    for (const [key, value] of Object.entries(obj)) (result[key] || (result[key] = [])).push(value);
  return result;
}
