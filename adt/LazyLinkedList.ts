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
export function match<A, B>(def: {
	Nil(): B;
	LazyCons(value: A, next: LazyLinkedList<A>): B;
}): (list: LazyLinkedList<A>) => B;
export function match<A, B>(
	list: LazyLinkedList<A>,
	def: { Nil(): B; LazyCons(value: A, next: LazyLinkedList<A>): B }
): B;
export function match() {
	return _purry(_match, arguments);
}
function _match<A, B>(
	list: LazyLinkedList<A>,
	def: { Nil(): B; LazyCons(value: A, next: LazyLinkedList<A>): B }
): B {
	const result = list();
	return result === Nil ? def.Nil() : def.LazyCons(result[0], result[1]);
}

export function chain<A, B>(
	f: (_: A) => LazyLinkedList<B>
): (list: LazyLinkedList<A>) => LazyLinkedList<B>;
export function chain<A, B>(
	list: LazyLinkedList<A>,
	f: (_: A) => LazyLinkedList<B>
): LazyLinkedList<B>;
export function chain() {
	return _purry(_chain, arguments);
}
function _chain<A, B>(list: LazyLinkedList<A>, f: (_: A) => LazyLinkedList<B>): LazyLinkedList<B> {
	return () =>
		_match(list, {
			Nil: () => Nil,
			LazyCons: (value, next) => concat(f(value), _chain(next, f))(),
		});
}

export function concat<A>(listA: LazyLinkedList<A>, listB: LazyLinkedList<A>): LazyLinkedList<A> {
	return () =>
		_match(listA, { Nil: listB, LazyCons: (value, next) => LazyCons(value, concat(next, listB)) });
}

export function empty<A = never>(): LazyLinkedList<A> {
	return () => Nil;
}

export function fromArguments<A>(...xs: A[]): LazyLinkedList<A> {
	return () => _fromArrayLike(xs);
}

export function fromArrayLike<A>(arrayLike: ArrayLike<A>): LazyLinkedList<A> {
	return () => _fromArrayLike(arrayLike);
}
function _fromArrayLike<A>(
	as: ArrayLike<A>,
	len: number = as.length,
	i: number = 0
): LazyResult<A> {
	return i < len ? LazyCons(as[i], () => _fromArrayLike(as, len, i + 1)) : Nil;
}

export function fromGenerator<A>(generator: () => Iterator<A>): LazyLinkedList<A> {
	return () => _fromIterator(generator());
}

export function fromIterable<A>(iterable: Iterable<A>): LazyLinkedList<A> {
	return () => _fromIterator(iterable[Symbol.iterator]());
}
function _fromIterator<A>(
	iter: Iterator<A>,
	current: IteratorResult<A> = iter.next()
): LazyResult<A> {
	return current.done ? Nil : LazyCons(current.value, () => _fromIterator(iter));
}

export function map<A, B>(f: (_: A) => B): (list: LazyLinkedList<A>) => LazyLinkedList<B>;
export function map<A, B>(list: LazyLinkedList<A>, f: (_: A) => B): LazyLinkedList<B>;
export function map() {
	return _purry(_map, arguments);
}
function _map<A, B>(list: LazyLinkedList<A>, f: (_: A) => B): LazyLinkedList<B> {
	return () =>
		_match<A, LazyResult<B>>(list, {
			Nil: () => Nil,
			LazyCons: (value, next) => LazyCons(f(value), _map(next, f)),
		});
}

export function of<A>(x: A): LazyLinkedList<A> {
	return () => LazyCons(x, () => Nil);
}

export function reduce<A, B>(f: (acc: B, _: A) => B, seed: B): (list: LazyLinkedList<A>) => B;
export function reduce<A, B>(list: LazyLinkedList<A>, f: (acc: B, _: A) => B, seed: B): B;
export function reduce() {
	return _purry(_reduce, arguments);
}
function _reduce<A, B>(list: LazyLinkedList<A>, f: (acc: B, _: A) => B, seed: B): B {
	let acc = seed;
	let current = list();
	while (current !== Nil) {
		acc = f(acc, current[0]);
		current = current[1]();
	}
	return acc;
}

export function unsafeReduceRight<A, B>(
	f: (acc: B, _: A) => B,
	seed: B
): (list: LazyLinkedList<A>) => B;
export function unsafeReduceRight<A, B>(
	list: LazyLinkedList<A>,
	f: (acc: B, _: A) => B,
	seed: B
): B;
export function unsafeReduceRight() {
	return _purry(_unsafeReduceRight, arguments);
}
function _unsafeReduceRight<A, B>(list: LazyLinkedList<A>, f: (acc: B, _: A) => B, seed: B): B {
	return _match(list, {
		Nil: () => seed,
		LazyCons: (value, next) => f(_unsafeReduceRight(next, f, seed), value),
	});
}

export function toArray<A>(list: LazyLinkedList<A>): A[] {
	return _reduce(list, (a, b) => a.concat([b]), [] as A[]);
}

export function toIterable<A>(list: LazyLinkedList<A>): Iterable<A> {
	return {
		[Symbol.iterator]() {
			let current = list;
			return {
				next() {
					const result = current();
					if (result === Nil) return { done: true, value: undefined as any };
					current = result[1];
					return { done: false, value: result[0] };
				},
			};
		},
	};
}

function _purry(this: any, fn: Function, _args: IArguments) {
	if (_args.length !== fn.length - 1) return fn.apply(this, _args);
	const self = this;
	const args = Array.from(_args);
	return function _purried(x: any) {
		return fn.apply(self, [x].concat(args));
	};
}
