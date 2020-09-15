export function truthyKeys<T>(obj: T): string {
  return Object.entries(obj)
    .map(([key, value]) => (value ? key : null))
    .filter((x): x is keyof T => x !== null)
    .join(' ');
}
