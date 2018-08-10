import { pipeline } from '../src/Util/pipeline';
import { List, Cons, Nil } from './List';

describe('chain', () => {
	const values = [10, 20, 30];
	const f = (x: number) => [x, x + 2, x + 3];
	const expected: number[] = [].concat.apply([], values.map(f));
	const list = List.fromIterable(values);
	test('data first', () => {
		const actual = List.toArray(List.chain(list, x => List.fromIterable(f(x))));
		expect(actual).toEqual(expected);
	});
	test('data last', () => {
		const actual = pipeline(list, List.chain(x => List.fromIterable(f(x))), List.toArray);
		expect(actual).toEqual(expected);
	});
});

describe('concat', () => {
	const a = [1, 2, 3];
	const b = [4, 5, 6];
	const expected = a.concat(b);
	const listA = List.fromIterable(a);
	const listB = List.fromIterable(b);
	test('data first', () => {
		const actual = List.toArray(List.concat(listA, listB));
		expect(actual).toEqual(expected);
	});
	test('data last', () => {});
	const actual = pipeline(listA, List.concat(listB));
	expect(actual).toEqual(expected);
});

test('empty', () => {
	expect(List.toArray(List.empty())).toEqual([]);
});

test('fromArguments', () => {
	expect(List.toArray(List.fromArguments())).toEqual([]);
	expect(List.toArray(List.fromArguments(42))).toEqual([42]);
	expect(List.toArray(List.fromArguments(1, 2, 3, 4, 5))).toEqual([1, 2, 3, 4, 5]);
});

test('fromArrayLike', () => {
	const arrayLike = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, length: 5 };
	const expected = Array.from(arrayLike);
	const actual = List.toArray(List.fromArrayLike(arrayLike));
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
		const listA = List.fromGenerator(generator);
		const listB = List.fromGenerator(generator);
		expect(List.toArray(listA)).toEqual(List.toArray(listB));
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
	const actual = List.toArray(List.fromIterable(iterable));
	expect(actual).toEqual(expected);
});

describe('map', () => {
	const values = [1, 2, 3, 4, 5];
	const f = (x: number) => x * 3;
	const g = (x: number) => x + 2;
	const expected = values.map(f).map(g);
	const list = List.fromIterable(values);
	test('data first', () => {
		const actual = List.toArray(List.map(List.map(list, f), g));
		expect(actual).toEqual(expected);
	});
	test('data last', () => {
		const actual = pipeline(list, List.map(f), List.map(g), List.toArray);
		expect(actual).toEqual(expected);
	});
});

describe('match', () => {
	const values = [1, 2, 3, 4];
	const ok = List.fromIterable(values);
	const nil = List.empty<number>();
	const f = (x: number, y: number) => x * 2 + y + 1;
	const seed = 8;
	const calc = (
		recFoldr: <A, B>(list: List<A>, f: (acc: B, _: A) => B, seed: B) => B,
		list: List<number>
	): number => recFoldr(list, f, seed);
	test('data first', () => {
		const recFoldr = <A, B>(list: List<A>, f: (acc: B, _: A) => B, seed: B): B => {
			return List.match(list, {
				Nil: () => seed,
				Cons: (value, next) => f(recFoldr(next, f, seed), value),
			});
		};
		expect(calc(recFoldr, ok)).toEqual(values.reduceRight(f, seed));
		expect(calc(recFoldr, nil)).toEqual([].reduceRight(f, seed));
	});
	test('data last', () => {
		const recFoldr = <A, B>(list: List<A>, f: (acc: B, _: A) => B, seed: B): B => {
			return List.match<A, B>({
				Nil: () => seed,
				Cons: (value, next) => f(recFoldr(next, f, seed), value),
			})(list);
		};
		expect(calc(recFoldr, ok)).toEqual(values.reduceRight(f, seed));
		expect(calc(recFoldr, nil)).toEqual([].reduceRight(f, seed));
	});
});

test('of', () => {
	expect(List.toArray(List.of(42))).toEqual([42]);
});

describe('reduce', () => {
	const ok = [1, 2, 3, 4].reduceRight<List<number>>(
		(next, value) => () => Cons(value, next),
		() => Nil
	);
	const nil: List<number> = () => Nil;
	const f = (x: number, y: number) => x * 2 + y + 1;
	const seed = 8;
	test('data first', () => {
		expect(List.reduce(ok, f, seed)).toEqual(169);
		expect(List.reduce(nil, f, seed)).toEqual(8);
	});
	test('data last', () => {
		expect(pipeline(ok, List.reduce(f, seed))).toEqual(169);
		expect(pipeline(nil, List.reduce(f, seed))).toEqual(8);
	});
});

test('toArray', () => {
	const expected = [1, 2, 3, 4, 5];
	const actual = List.toArray(() =>
		Cons(1, () => Cons(2, () => Cons(3, () => Cons(4, () => Cons(5, () => Nil)))))
	);
	expect(actual).toEqual(expected);
});

describe('toIterable', () => {
	const array = [1, 2, 3, 4, 5];
	const list = List.toIterable(List.fromArrayLike(array));
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
		},
	});
	const ok = [1, 2, 3, 4].reduceRight<List<number>>(
		(next, value) => () => Cons(value, next),
		() => Nil
	);
	const nil: List<number> = () => Nil;
	const f = (x: number, y: number) => x * 2 + y + 1;
	const seed = 8;
	test('data first', () => {
		expect(List.unsafeReduceRight(ok, f, seed)).toEqual(192);
		expect(List.unsafeReduceRight(nil, f, seed)).toEqual(8);
	});
	test('data last', () => {
		expect(pipeline(ok, List.unsafeReduceRight(f, seed))).toEqual(192);
		expect(pipeline(nil, List.unsafeReduceRight(f, seed))).toEqual(8);
	});
	test('is not stack safe', () => {
		const list = List.fromIterable(createIterable(1e5));
		expect(() => List.unsafeReduceRight(list, (_, last) => last, 0)).toThrow();
	});
});
