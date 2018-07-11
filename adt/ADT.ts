export interface Functor<F, A> {
	map<B>(f: (_: A) => B): Functor<F, B>;
}
export interface Apply<F, A> extends Functor<F, A> {
	ap<B>(that: Apply<F, (_: A) => B>): Apply<F, B>;
	map<B>(f: (_: A) => B): Apply<F, B>;
}
export interface Applicative<F> {
	of<A>(a: A): Apply<F, A>;
}
