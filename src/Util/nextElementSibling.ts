import { Just, Maybe } from '../../adt/Maybe';
export function nextElementSibling(node: Node): Maybe<Element> {
	return Maybe.fromNullable(node.nextSibling).chain(node =>
		Maybe.chainRec(
			(next, done, node) =>
				node.nodeType === Node.ELEMENT_NODE
					? Just(done(node as Element))
					: Maybe.fromNullable(node.nextSibling).map(next),
			node
		)
	);
}
