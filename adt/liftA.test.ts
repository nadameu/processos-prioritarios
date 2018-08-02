import { Apply } from './ADT';
import { Left, Right } from './Either';
import { liftA1, liftA2, liftA3, liftA4 } from './liftA';
import { Just, Maybe, Nothing } from './Maybe';
import { Foldable } from './Foldable';

const f1 = (x: number) => x * 8;
const f2 = (x: number, y: number) => x * y;
const f3 = (a: number, b: number, c: number) => a + b * c;
const f4 = (a: number, b: number, c: number, d: number) => (a - b) * c * d;

function createTest(
	description: string,
	right: <A>(_: A) => Apply<A>,
	left: Apply<any>,
	transform?: (_: Apply<number>) => number
) {
	describe(description, () => {
		const a = right(2);
		const b = right(3);
		const c = right(5);
		const d = right(7);
		const n = left;
		const normalize = transform ? transform : (x: Apply<number>) => x;
		test('liftA1', () => {
			/* a */ expect(normalize(liftA1(f1, a))).toEqual(normalize(right(16)));
			/* _ */ expect(normalize(liftA1(f1, n))).toEqual(normalize(left));
		});
		test('liftA2', () => {
			/* ab */ expect(normalize(liftA2(f2, a, b))).toEqual(normalize(right(6)));
			/* _b */ expect(normalize(liftA2(f2, n, b))).toEqual(normalize(left));
			/* a_ */ expect(normalize(liftA2(f2, a, n))).toEqual(normalize(left));
			/* __ */ expect(normalize(liftA2(f2, n, n))).toEqual(normalize(left));
		});
		test('liftA3', () => {
			/* abc */ expect(normalize(liftA3(f3, a, b, c))).toEqual(normalize(right(17)));
			/* _bc */ expect(normalize(liftA3(f3, n, b, c))).toEqual(normalize(left));
			/* a_c */ expect(normalize(liftA3(f3, a, n, c))).toEqual(normalize(left));
			/* ab_ */ expect(normalize(liftA3(f3, a, b, n))).toEqual(normalize(left));
			/* ___ */ expect(normalize(liftA3(f3, n, n, n))).toEqual(normalize(left));
		});
		test('liftA4', () => {
			/* abcd */ expect(normalize(liftA4(f4, a, b, c, d))).toEqual(normalize(right(-35)));
			/* _bcd */ expect(normalize(liftA4(f4, n, b, c, d))).toEqual(normalize(left));
			/* a_cd */ expect(normalize(liftA4(f4, a, n, c, d))).toEqual(normalize(left));
			/* ab_d */ expect(normalize(liftA4(f4, a, b, n, d))).toEqual(normalize(left));
			/* abc_ */ expect(normalize(liftA4(f4, a, b, c, n))).toEqual(normalize(left));
			/* ____ */ expect(normalize(liftA4(f4, n, n, n, n))).toEqual(normalize(left));
		});
	});
}

createTest('Maybe', Just, Nothing as Maybe<any>);
createTest('Either', Right, Left('Error'));
createTest('Foldable', Foldable.of, Foldable.zero(), ((x: Foldable<number>): number =>
	x.reduce((a, b) => a + b, 0)) as any);
