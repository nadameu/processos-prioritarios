export function definirPropriedades(target: object, ...sources: object[]) {
  const sourceDescriptors = sources.map(source => Object.getOwnPropertyDescriptors(source));
  for (const desc of sourceDescriptors) {
    Object.defineProperties(target, desc);
  }
  return target;
}
