import * as L3 from './LazyLinkedList';

test('chain', () => {
	const as = L3.fromIterable([10, 20, 30]);
	const list = L3.chain(as, x => L3.fromArrayLike([x, x + 2, x + 3]));
	const actual = [];
	let result = list();
	while (!result.isEmpty) {
		actual.push(result.value);
		result = result.next();
	}
	expect(actual).toEqual([10, 12, 13, 20, 22, 23, 30, 32, 33]);
});

test('concat', () => {
	const a = [1, 2, 3];
	const b = [4, 5, 6];
	const expected = a.concat(b);
	const list = L3.concat(L3.fromIterable(a), L3.fromArrayLike(b));
	const actual = [];
	let result = list();
	while (!result.isEmpty) {
		actual.push(result.value);
		result = result.next();
	}
	expect(actual).toEqual(expected);
});

test('fromArrayLike', () => {
	const expected = [5, 4, 3, 2, 1];
	const list = L3.fromArrayLike(expected);
	const actual = [];
	let result = list();
	while (!result.isEmpty) {
		actual.push(result.value);
		result = result.next();
	}
	expect(actual).toEqual(expected);
});

test('fromIterable', () => {
	const expected = [5, 4, 3, 2, 1];
	const list = L3.fromIterable(expected);
	const actual = [];
	let result = list();
	while (!result.isEmpty) {
		actual.push(result.value);
		result = result.next();
	}
	expect(actual).toEqual(expected);
});

test('map', () => {
	const values = [1, 2, 3, 4, 5];
	const f = (x: number) => x * 3;
	const g = (x: number) => x + 2;
	[[f, g], [g, f]].forEach(([f, g]) => {
		const expected = values.map(f).map(g);
		const actual = L3.toArray(L3.map(L3.map(L3.fromIterable(values), f), g));
		expect(actual).toEqual(expected);
	});
});

test('reduce', () => {
	const values = '123456'.split('');
	const expected = values
		.map(Number)
		.map(x => x * 3)
		.filter(x => x > 10)
		.map(x => [x + 1, x + 2])
		.reduce((acc, x) => acc.concat(x), []);
	const list = L3.fromIterable(values);
	const actual = L3.reduce(
		list,
		(array, x) => {
			const y = Number(x) * 3;
			if (y > 10) {
				array.push(y + 1);
				array.push(y + 2);
			}
			return array;
		},
		[] as number[]
	);
	expect(actual).toEqual(expected);
});

test('toArray', () => {
	const expected = [1, 2, 3, 4, 5];
	const list = expected.reduceRight<L3.LazyLinkedList<number>>(
		(next, value) => () => L3.LazyCons(value, next),
		() => L3.Nil
	);
	const actual = L3.toArray(list);
	expect(actual).toEqual(expected);
});
