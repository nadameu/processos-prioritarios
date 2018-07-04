export interface Either<L, R> {
	<B>(f: (_: L) => B, g: (_: R) => B): B;
}
