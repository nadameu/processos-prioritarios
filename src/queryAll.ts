import { List } from './List';

export function queryAll<T extends Element>(
  selector: string,
  parent: ParentNode = document
): List<T> {
  return List.fromIterable(parent.querySelectorAll<T>(selector));
}
