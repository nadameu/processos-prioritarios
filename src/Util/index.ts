import { Maybe } from '../../adt/Maybe';
interface HasNumericIndex<A> {
	[index: number]: A;
}
export function index(i: number): <A>(obj: HasNumericIndex<A>) => Maybe<A> {
	return function(obj) {
		return Maybe.fromNullable(obj[i]);
	};
}
