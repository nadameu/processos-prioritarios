import { Apply } from './ADT';
import { Left, Right } from './Either';
import { liftA1, liftA2, liftA3, liftA4 } from './liftA';
import { Just, Maybe, Nothing } from './Maybe';

const f1 = (x: number) => x * 8;
const f2 = (x: number, y: number) => x * y;
const f3 = (a: number, b: number, c: number) => a + b * c;
const f4 = (a: number, b: number, c: number, d: number) => (a - b) * c * d;

const createTest = (
	description: string,
	right: <A>(_: A) => Apply<A>,
	left: Apply<any>
) => {
	describe(description, () => {
		const a = right(2);
		const b = right(3);
		const c = right(5);
		const d = right(7);
		const n = left;
		test('liftA1', () => {
			/* a */ expect(liftA1(f1, a)).toEqual(right(16));
			/* _ */ expect(liftA1(f1, n)).toEqual(left);
		});
		test('liftA2', () => {
			/* ab */ expect(liftA2(f2, a, b)).toEqual(right(6));
			/* _b */ expect(liftA2(f2, n, b)).toEqual(left);
			/* a_ */ expect(liftA2(f2, a, n)).toEqual(left);
			/* __ */ expect(liftA2(f2, n, n)).toEqual(left);
		});
		test('liftA3', () => {
			/* abc */ expect(liftA3(f3, a, b, c)).toEqual(right(17));
			/* _bc */ expect(liftA3(f3, n, b, c)).toEqual(left);
			/* a_c */ expect(liftA3(f3, a, n, c)).toEqual(left);
			/* ab_ */ expect(liftA3(f3, a, b, n)).toEqual(left);
			/* ___ */ expect(liftA3(f3, n, n, n)).toEqual(left);
		});
		test('liftA4', () => {
			/* abcd */ expect(liftA4(f4, a, b, c, d)).toEqual(right(-35));
			/* _bcd */ expect(liftA4(f4, n, b, c, d)).toEqual(left);
			/* a_cd */ expect(liftA4(f4, a, n, c, d)).toEqual(left);
			/* ab_d */ expect(liftA4(f4, a, b, n, d)).toEqual(left);
			/* abc_ */ expect(liftA4(f4, a, b, c, n)).toEqual(left);
			/* ____ */ expect(liftA4(f4, n, n, n, n)).toEqual(left);
		});
	});
};

createTest('Maybe', Just, Nothing as Maybe<any>);
createTest('Either', Right, Left('Error'));
