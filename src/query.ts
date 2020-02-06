export function query<T extends Element>(
  selector: string,
  parent: ParentNode = document
): Promise<T> {
  const el = parent.querySelector<T>(selector);
  return el === null
    ? Promise.reject(new Error(`Elemento não encontrado: '${selector}'.`))
    : Promise.resolve(el);
}
