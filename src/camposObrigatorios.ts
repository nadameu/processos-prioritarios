type ResultadoTemporario<T, K extends Array<keyof T>> = {
  [key in K[number]]: T[key] extends infer U | null | undefined ? U : never;
} &
  Omit<T, K[number]>;
type Resultado<T, K extends Array<keyof T>> =
  | { [key in keyof T]: ResultadoTemporario<T, K>[key] }
  | null;

export function camposObrigatorios<T, K extends Array<keyof T>>(obj: T, keys: K): Resultado<T, K> {
  for (const key of keys) {
    if (obj[key] == null) return null;
  }
  return obj as Resultado<T, K>;
}
