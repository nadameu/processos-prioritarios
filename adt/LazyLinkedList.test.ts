import * as L from './LazyLinkedList';

describe('chain', () => {
	const values = [10, 20, 30];
	const f = (x: number) => [x, x + 2, x + 3];
	const expected = values.map(f).reduce((acc, xs) => acc.concat(xs), [] as number[]);
	const list = L.fromIterable(values);
	test('data first', () => {
		const actual = fromLazyList(L.chain(list, x => L.fromIterable(f(x))));
		expect(actual).toEqual(expected);
	});
	test('data last', () => {
		const actual = pipeline(list, L.chain(x => L.fromIterable(f(x))), fromLazyList);
		expect(actual).toEqual(expected);
	});
});

test('concat', () => {
	const a = [1, 2, 3];
	const b = [4, 5, 6];
	const expected = a.concat(b);
	const list = L.concat(L.fromIterable(a), L.fromIterable(b));
	const actual = fromLazyList(list);
	expect(actual).toEqual(expected);
});

test('empty', () => {
	expect(fromLazyList(L.empty())).toEqual([]);
});

test('fromArguments', () => {
	expect(fromLazyList(L.fromArguments())).toEqual([]);
	expect(fromLazyList(L.fromArguments(42))).toEqual([42]);
	expect(fromLazyList(L.fromArguments(1, 2, 3, 4, 5))).toEqual([1, 2, 3, 4, 5]);
});

test('fromArrayLike', () => {
	const arrayLike = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, length: 5 };
	const expected = Array.from(arrayLike);
	const list = L.fromArrayLike(arrayLike);
	const actual = fromLazyList(list);
	expect(actual).toEqual(expected);
});

describe('fromGenerator', () => {
	test('can be called multiple times', () => {
		const generator = function*() {
			yield 1;
			yield 2;
			yield 3;
			yield 4;
			yield 5;
		};
		const listA = L.fromGenerator(generator);
		const listB = L.fromGenerator(generator);
		expect(fromLazyList(listA)).toEqual(fromLazyList(listB));
	});
});

test('fromIterable', () => {
	const iterable: Iterable<number> = {
		*[Symbol.iterator]() {
			yield 1;
			yield 2;
			yield 3;
			yield 4;
			yield 5;
		},
	};
	const expected = Array.from(iterable);
	const list = L.fromIterable(iterable);
	const actual = fromLazyList(list);
	expect(actual).toEqual(expected);
});

describe('map', () => {
	const values = [1, 2, 3, 4, 5];
	const f = (x: number) => x * 3;
	const g = (x: number) => x + 2;
	const expected = values.map(f).map(g);
	const list = L.fromIterable(values);
	test('data first', () => {
		const actual = fromLazyList(L.map(L.map(list, f), g));
		expect(actual).toEqual(expected);
	});
	test('data last', () => {
		const actual = pipeline(list, L.map(f), L.map(g), fromLazyList);
		expect(actual).toEqual(expected);
	});
});

describe('match', () => {
	const ok = [1, 2, 3, 4].reduceRight<L.LazyLinkedList<number>>(
		(next, value) => () => L.LazyCons(value, next),
		() => L.Nil
	);
	const nil: L.LazyLinkedList<number> = () => L.Nil;
	const f = (x: number, y: number) => x * 2 + y + 1;
	const seed = 8;
	const calc = (
		recFoldr: <A, B>(list: L.LazyLinkedList<A>, f: (acc: B, _: A) => B, seed: B) => B,
		list: L.LazyLinkedList<number>
	): number => recFoldr(list, f, seed);
	test('data first', () => {
		const recFoldr = <A, B>(list: L.LazyLinkedList<A>, f: (acc: B, _: A) => B, seed: B): B => {
			return L.match(list, {
				Nil: () => seed,
				LazyCons: (value, next) => f(recFoldr(next, f, seed), value),
			});
		};
		expect(calc(recFoldr, ok)).toEqual(192);
		expect(calc(recFoldr, nil)).toEqual(8);
	});
	test('data last', () => {
		const recFoldr = <A, B>(list: L.LazyLinkedList<A>, f: (acc: B, _: A) => B, seed: B): B => {
			return L.match<A, B>({
				Nil: () => seed,
				LazyCons: (value, next) => f(recFoldr(next, f, seed), value),
			})(list);
		};
		expect(calc(recFoldr, ok)).toEqual(192);
		expect(calc(recFoldr, nil)).toEqual(8);
	});
});

test('of', () => {
	expect(fromLazyList(L.of(42))).toEqual([42]);
});

describe('reduce', () => {
	const ok = [1, 2, 3, 4].reduceRight<L.LazyLinkedList<number>>(
		(next, value) => () => L.LazyCons(value, next),
		() => L.Nil
	);
	const nil: L.LazyLinkedList<number> = () => L.Nil;
	const f = (x: number, y: number) => x * 2 + y + 1;
	const seed = 8;
	test('data first', () => {
		expect(L.reduce(ok, f, seed)).toEqual(169);
		expect(L.reduce(nil, f, seed)).toEqual(8);
	});
	test('data last', () => {
		expect(pipeline(ok, L.reduce(f, seed))).toEqual(169);
		expect(pipeline(nil, L.reduce(f, seed))).toEqual(8);
	});
});

test('toArray', () => {
	const expected = [1, 2, 3, 4, 5];
	const list = L.fromIterable(expected);
	const actual = L.toArray(list);
	expect(actual).toEqual(expected);
});

describe('toIterable', () => {
	const array = [1, 2, 3, 4, 5];
	const list = L.toIterable(L.fromArrayLike(array));
	test('Array.from', () => {
		expect(Array.from(list)).toEqual(array);
	});
	test('Symbol.iterator', () => {
		const iterArray = array[Symbol.iterator]();
		const iterList = list[Symbol.iterator]();
		let resultArray: IteratorResult<number>;
		let resultList: IteratorResult<number>;
		do {
			resultArray = iterArray.next();
			resultList = iterList.next();
			expect(resultList).toEqual(resultArray);
		} while (!resultArray.done && !resultList.done);
	});
	test('for ... of', () => {
		let i = 0;
		for (const x of list) {
			expect(x).toEqual(array[i++]);
		}
	});
});

describe('unsafeReduceRight', () => {
	const createIterable = (limit: number) => ({
		*[Symbol.iterator]() {
			let i = 1;
			while (i <= limit) {
				yield i++;
			}
			console.log('nope');
		},
	});
	const ok = [1, 2, 3, 4].reduceRight<L.LazyLinkedList<number>>(
		(next, value) => () => L.LazyCons(value, next),
		() => L.Nil
	);
	const nil: L.LazyLinkedList<number> = () => L.Nil;
	const f = (x: number, y: number) => x * 2 + y + 1;
	const seed = 8;
	test('data first', () => {
		expect(L.unsafeReduceRight(ok, f, seed)).toEqual(192);
		expect(L.unsafeReduceRight(nil, f, seed)).toEqual(8);
	});
	test('data last', () => {
		expect(pipeline(ok, L.unsafeReduceRight(f, seed))).toEqual(192);
		expect(pipeline(nil, L.unsafeReduceRight(f, seed))).toEqual(8);
	});
	test('is not stack safe', () => {
		const list = L.fromIterable(createIterable(1e5));
		expect(() => L.unsafeReduceRight(list, (_, last) => last, 0)).toThrow();
	});
});

function fromLazyList<A>(list: L.LazyLinkedList<A>): A[] {
	let array = [];
	let current = list();
	while (current !== L.Nil) {
		array.push(current[0]);
		current = current[1]();
	}
	return array;
}

type Fn<A, B> = (_: A) => B;
function pipeline<A, B>(a: A, f: Fn<A, B>): B;
function pipeline<A, B, C>(a: A, f: Fn<A, B>, g: Fn<B, C>): C;
function pipeline<A, B, C, D>(a: A, f: Fn<A, B>, g: Fn<B, C>, h: Fn<C, D>): D;
function pipeline(initial: any, ...fs: Function[]) {
	return fs.reduce((res, f) => f(res), initial);
}
