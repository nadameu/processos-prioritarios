import { Task } from '../src/Task';
import { Either, Left, Right } from './Either';
import { Maybe, Nothing, Just } from './Maybe';

/* === Either === */
export function eitherToTask<E, A>(either: Either<E, A>): Task<E, A> {
	return either.either<Task<E, A>>(Task.rejected, Task.of);
}
export function eitherToMaybe<A>(either: Either<any, A>): Maybe<A> {
	return either.either<Maybe<A>>(Nothing, a => Just(a));
}
export function eitherToPromise<A>(either: Either<any, A>): Promise<A> {
	return either.either<Promise<A>>(
		e => Promise.reject(e),
		a => Promise.resolve(a)
	);
}

/* === Maybe === */
export function maybeToEither<L, R>(
	getLeft: () => L,
	maybe: Maybe<R>
): Either<L, R> {
	return maybe.maybe<Either<L, R>>(() => Left(getLeft()), r => Right(r));
}
export function maybeToTask<E, A>(
	getRej: () => E,
	maybe: Maybe<A>
): Task<E, A> {
	return maybe.maybe<Task<E, A>>(() => Task.rejected(getRej()), Task.of);
}
export function maybeToPromise<A>(
	getRej: () => any,
	maybe: Maybe<A>
): Promise<A> {
	return maybe.maybe<Promise<A>>(
		() => Promise.reject(getRej()),
		a => Promise.resolve(a)
	);
}

/* === Task === */
export function taskToPromise<A>(task: Task<any, A>): Promise<A> {
	return new Promise((resolve, reject) => void task.fork(reject, resolve));
}
