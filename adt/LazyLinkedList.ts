export interface LazyLinkedList<A> {
	(): LazyResult<A>;
}
type LazyResult<A> = LazyCons<A> | Nil;
interface Nil {
	isEmpty: true;
}
interface LazyCons<A> {
	isEmpty: false;
	value: A;
	next: LazyLinkedList<A>;
}

export const Nil: Nil = { isEmpty: true };
export function LazyCons<A>(value: A, next: LazyLinkedList<A>): LazyCons<A> {
	return { isEmpty: false, value, next };
}

export function fromArrayLike<A>(as: ArrayLike<A>): LazyLinkedList<A> {
	return () => _fromArrayLike(as);
}
function _fromArrayLike<A>(
	as: ArrayLike<A>,
	len: number = as.length,
	i: number = 0
): LazyResult<A> {
	return i < len ? LazyCons(as[i], () => _fromArrayLike(as, len, i + 1)) : Nil;
}

export function fromIterable<A>(as: Iterable<A>): LazyLinkedList<A> {
	return () => _fromIterable(as[Symbol.iterator]());
}
function _fromIterable<A>(
	iter: Iterator<A>,
	current: IteratorResult<A> = iter.next()
): LazyResult<A> {
	return current.done ? Nil : LazyCons(current.value, () => _fromIterable(iter));
}

export function chain<A, B>(
	as: LazyLinkedList<A>,
	f: (_: A) => LazyLinkedList<B>
): LazyLinkedList<B> {
	return _transformCons(as, (value, next) => concat(f(value), chain(next, f))());
}

export function concat<A>(as: LazyLinkedList<A>, bs: LazyLinkedList<A>): LazyLinkedList<A> {
	return _transform(as, bs, (value, next) => LazyCons(value, concat(next, bs)));
}

export function map<A, B>(as: LazyLinkedList<A>, f: (_: A) => B): LazyLinkedList<B> {
	return _transformCons(as, (value, next) => LazyCons(f(value), map(next, f)));
}

export function reduce<A, B>(as: LazyLinkedList<A>, f: (acc: B, _: A) => B, seed: B): B {
	let acc = seed;
	let result = as();
	while (!result.isEmpty) {
		acc = f(acc, result.value);
		result = result.next();
	}
	return acc;
}

export function toArray<A>(as: LazyLinkedList<A>): A[] {
	return reduce(as, (a, b) => a.concat([b]), [] as A[]);
}

function _transform<A, B>(
	list: LazyLinkedList<A>,
	f: () => LazyResult<B>,
	g: (value: A, next: LazyLinkedList<A>) => LazyResult<B>
): LazyLinkedList<B> {
	return () => {
		const result = list();
		return result.isEmpty ? f() : g(result.value, result.next);
	};
}

function _transformCons<A, B>(
	list: LazyLinkedList<A>,
	f: (value: A, next: LazyLinkedList<A>) => LazyResult<B>
): LazyLinkedList<B> {
	return _transform(list, () => Nil, f);
}
