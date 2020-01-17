export function truthyKeys(obj: object): string {
  return Object.entries(obj)
    .map(([key, value]) => (value ? key : null))
    .filter((x): x is string => x !== null)
    .join(' ');
}
