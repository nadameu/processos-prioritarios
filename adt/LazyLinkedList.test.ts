import * as L3 from './LazyLinkedList';

test('chain', () => {
	const values = [10, 20, 30];
	const f = (x: number) => [x, x + 2, x + 3];
	const expected = fromArray(values.map(f).reduce((acc, xs) => acc.concat(xs), [] as number[]));
	const list = L3.chain(L3.fromIterable(values), x => L3.fromIterable(f(x)));
	const actual = fromLazyList(list);
	expect(actual).toEqual(expected);
});

test('concat', () => {
	const a = [1, 2, 3];
	const b = [4, 5, 6];
	const expected = fromArray(a.concat(b));
	const list = L3.concat(L3.fromIterable(a), L3.fromIterable(b));
	const actual = fromLazyList(list);
	expect(actual).toEqual(expected);
});

test('fromArrayLike', () => {
	const arrayLike = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, length: 5 };
	const expected = fromArray(Array.from(arrayLike));
	const list = L3.fromArrayLike(arrayLike);
	const actual = fromLazyList(list);
	expect(actual).toEqual(expected);
});

test('fromIterable', () => {
	const generator: () => Iterable<number> = function*() {
		yield 1;
		yield 2;
		yield 3;
		yield 4;
		yield 5;
	};
	const expected = fromArray(Array.from(generator()));
	const list = L3.fromIterable(generator());
	const actual = fromLazyList(list);
	expect(actual).toEqual(expected);
});

test('map', () => {
	const values = [1, 2, 3, 4, 5];
	const f = (x: number) => x * 3;
	const g = (x: number) => x + 2;
	const expected = fromArray(values.map(f).map(g));
	const actual = fromLazyList(L3.map(L3.map(L3.fromIterable(values), f), g));
	expect(actual).toEqual(expected);
});

test('reduce', () => {
	type Result<A> = Next<A> | Done;
	type Next<A> = { isDone: false; prev: Result<A>; value: A };
	type Done = { isDone: true };
	const Done: Done = { isDone: true };
	const Next = <A>(prev: Result<A>, value: A): Next<A> => ({ isDone: false, prev, value });
	const values = [1, 2, 3, 4, 5];
	const expected = values.reduce<Result<number>>(Next, Done);
	const list = L3.fromIterable(values);
	const actual = L3.reduce<number, Result<number>>(list, Next, Done);
	expect(actual).toEqual(expected);
});

test('toArray', () => {
	const expected = [1, 2, 3, 4, 5];
	const list = L3.fromIterable(expected);
	const actual = L3.toArray(list);
	expect(actual).toEqual(expected);
});

type LinkedList<A> = Cons<A> | Nil;
interface Cons<A> {
	0: A;
	1: LinkedList<A>;
	length: 2;
}
type Nil = 0;
const Nil: Nil = 0;
const Cons = <A>(value: A, next: LinkedList<A>): Cons<A> => [value, next];
function fromLazyList<A>(list: L3.LazyLinkedList<A>): LinkedList<A> {
	let head: LinkedList<A> = 0;
	let previousLink: LinkedList<A> = 0;
	let currentLink: LinkedList<A> = 0;
	let current = list();
	while (current !== L3.Nil) {
		currentLink = Cons(current[0], Nil);
		if (previousLink !== Nil) previousLink[1] = currentLink;
		if (head === Nil) head = previousLink;
		previousLink = currentLink;
		current = current[1]();
	}
	return head;
}
function fromArray<A>(array: A[]): LinkedList<A> {
	return array.reduceRight<LinkedList<A>>((prev, value) => [value, prev], 0);
}
