export interface Functor<A> {
	map<B>(f: (_: A) => B): Functor<B>;
}
export interface Apply<A> extends Functor<A> {
	ap<B>(that: Apply<(_: A) => B>): Apply<B>;
	map<B>(f: (_: A) => B): Apply<B>;
}
export interface Applicative {
	of<A>(a: A): Apply<A>;
}
export interface Chain<A> extends Apply<A> {
	ap<B>(that: Chain<(_: A) => B>): Chain<B>;
	chain<B>(f: (_: A) => Chain<B>): Chain<B>;
	map<B>(f: (_: A) => B): Chain<B>;
}
