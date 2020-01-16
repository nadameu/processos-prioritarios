export function queryAll<T extends Element>(
  selector: string,
  parent: ParentNode = document
): Array<T> {
  return Array.from(parent.querySelectorAll<T>(selector));
}
