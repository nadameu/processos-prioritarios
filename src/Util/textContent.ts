import { Maybe, maybe, pipe } from 'adt-ts';

export const textContent: (node: Node) => Maybe<string> = pipe(
  maybe.safeProp<Node, 'textContent'>('textContent'),
  maybe.bindMethod('trim'),
  maybe.filter(t => t !== '')
);
