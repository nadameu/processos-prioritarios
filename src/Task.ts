import { Maybe, Nothing, Just } from './Maybe';
import { Either, Left } from './Either';

/* === Helpers === */
interface Handler<T> {
	(_: T): void;
}
interface Cancel {
	(): void;
}
interface TaskRunner<E, A> {
	(onRejected: Handler<E>, onResolved: Handler<A>): void | Cancel;
}
function noop() {}

/* === Base === */
export class TaskImpl<E, A> {
	isTask = true;
	private _result: Maybe<Either<E, A>> = Nothing();

	constructor(private readonly _fork: TaskRunner<E, A>) {}

	fork(onRejected: Handler<E>, onResolved: Handler<A>): Cancel {
		if (this._result.isJust) {
			this._result.map(result => result.either(onRejected, onResolved));
		}
		return (
			this._fork(
				e => {
					if (this._result.isNothing) {
						this._result = Just(Left(e));
						onRejected(e);
					}
				},
				a => {}
			) || noop
		);
	}
}

/* === Static methods === */

export function of<E, A>(value: A): Task<E, A> {
	return Task((_, res) => res(value));
}

/* === Task === */
export interface Task<E, A> extends TaskImpl<E, A> {}
export const Task = Object.assign(function Task<E, A>(
	fork: TaskRunner<E, A>
): Task<E, A> {
	return new TaskImpl(fork);
},
{});
