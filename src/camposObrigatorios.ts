type Resultado<T, K extends keyof T> =
  | {
      [key in keyof T]: key extends K
        ? T[key] extends infer U | null | undefined
          ? U
          : never
        : T[key];
    }
  | null;

export function camposObrigatorios<T, K extends keyof T>(
  obj: T,
  keys = Object.keys(obj) as K[]
): Resultado<T, K> {
  for (const key of keys) {
    if (obj[key] == null) return null;
  }
  return obj as Resultado<T, K>;
}
