export function safePipe<a>(value: a | null | undefined): a | null | undefined;
export function safePipe<a, b>(
  value: a | null | undefined,
  f0: (_: a) => b | null | undefined
): b | null | undefined;
export function safePipe<a, b, c>(
  value: a | null | undefined,
  f0: (_: a) => b | null | undefined,
  f1: (_: b) => c | null | undefined
): c | null | undefined;
export function safePipe<a, b, c, d>(
  value: a | null | undefined,
  f0: (_: a) => b | null | undefined,
  f1: (_: b) => c | null | undefined,
  f2: (_: c) => d | null | undefined
): d | null | undefined;
export function safePipe(value: any, ...fs: Function[]) {
  return fs.reduce((x, f) => (x == null ? x : f(x)), value);
}
