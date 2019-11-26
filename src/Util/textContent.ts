import { Maybe } from '../../adt/Maybe';
export function textContent(node: Node): Maybe<string> {
  return Maybe.fromNullable(node.textContent)
    .map(t => t.trim())
    .filter(t => t !== '');
}
