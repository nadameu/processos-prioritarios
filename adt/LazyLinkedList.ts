export interface LazyLinkedList<A> {
	(): LazyResult<A>;
}
type LazyResult<A> = LazyCons<A> | Nil;
type Nil = 0;
type LazyCons<A> = [A, LazyLinkedList<A>];

export const Nil: Nil = 0;
export function LazyCons<A>(value: A, next: LazyLinkedList<A>): LazyCons<A> {
	return [value, next];
}
export function match<A, B>(
	list: LazyLinkedList<A>,
	def: { Nil(): B; LazyCons(value: A, next: LazyLinkedList<A>): B }
): B {
	const result = list();
	return result === Nil ? def.Nil() : def.LazyCons(result[0], result[1]);
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
	list: LazyLinkedList<A>,
	f: (_: A) => LazyLinkedList<B>
): LazyLinkedList<B> {
	return () =>
		match(list, {
			Nil: () => Nil,
			LazyCons: (value, next) => concat(f(value), chain(next, f))(),
		});
}

export function concat<A>(listA: LazyLinkedList<A>, listB: LazyLinkedList<A>): LazyLinkedList<A> {
	return () =>
		match(listA, { Nil: listB, LazyCons: (value, next) => LazyCons(value, concat(next, listB)) });
}

export function map<A, B>(list: LazyLinkedList<A>, f: (_: A) => B): LazyLinkedList<B> {
	return () =>
		match<A, LazyResult<B>>(list, {
			Nil: () => Nil,
			LazyCons: (value, next) => LazyCons(f(value), map(next, f)),
		});
}

export function reduce<A, B>(list: LazyLinkedList<A>, f: (acc: B, _: A) => B, seed: B): B {
	let acc = seed;
	let current = list();
	while (current !== Nil) {
		acc = f(acc, current[0]);
		current = current[1]();
	}
	return acc;
}

export function toArray<A>(as: LazyLinkedList<A>): A[] {
	return reduce(as, (a, b) => a.concat([b]), [] as A[]);
}
