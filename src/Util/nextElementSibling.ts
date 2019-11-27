import { Maybe, maybe } from 'adt-ts';

export function nextElementSibling(node: Node): Maybe<Element> {
  let current = node.nextSibling;
  while (current !== null && current.nodeType !== Node.ELEMENT_NODE) current = current.nextSibling;
  return maybe.fromNullable(current as Element | null);
}
