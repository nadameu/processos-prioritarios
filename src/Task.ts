import { Either, Left, Right } from './Either';
import { Maybe, Nothing, Just } from './Maybe';
import { These, This, That, Both } from './These';

/* === Helpers === */
interface Handler<T> {
	(_: T): void;
}
interface Cancel {
	(): void;
}
interface TaskRunner<E, A> {
	(onRejected: Handler<E>, onResolved: Handler<A>): any;
}
function noop() {}

/* === Base === */
export class TaskImpl<E, A> {
	isTask: () => this is Task<E, A> = () => true;

	constructor(private readonly _fork: TaskRunner<E, A>) {}

	ap<B>(that: Task<E, (_: A) => B>): Task<E, B> {
		return Task((rej, res) => {
			let result: Either<
				E,
				{
					a: Maybe<A>;
					f: Maybe<(_: A) => B>;
				}
			> = Right({ a: Nothing(), f: Nothing() });
			const guardRej = (e: E) => {
				if (result.isRight()) {
					result = Left(e);
					rej(e);
				}
			};
			const cancelA = this.fork(guardRej, a => {
				result = result.map(({ f }) => ({ f, a: Just(a) }));
				if (result.isRight()) {
					if (result.rightValue.f.isJust()) {
						result = result.map(({ f }) => ({ f, a: Just(a) }));
					} else {
						const f = result.rightValue.f.value;
						result = Right(Just);
					}
				}
			});
			const cancelF = that.fork(guardRej, f => {});
			return () => {
				cancelA();
				cancelF();
			};
		});
	}
	chain<B>(f: (_: A) => Task<E, B>): Task<E, B> {
		return Task((rej, res) => {
			let cancelInner: Cancel;
			const cancelOuter = this.fork(rej, a => {
				cancelInner = f(a).fork(rej, res);
			});
			return () => {
				cancelInner();
				cancelOuter();
			};
		});
	}
	fork(onRejected: Handler<E>, onResolved: Handler<A>): Cancel {
		let result: 'PENDING' | 'SETTLED' = 'PENDING';
		let cancel = this._fork(
			e => {
				if (result === 'PENDING') {
					result = 'SETTLED';
					onRejected(e);
					setImmediate(cancel);
				}
			},
			a => {
				if (result === 'PENDING') {
					result = 'SETTLED';
					onResolved(a);
					setImmediate(cancel);
				}
			}
		);
		if (typeof cancel !== 'function') {
			cancel = noop;
		}
		return cancel;
	}
}

/* === Static methods === */

export function of<E, A>(value: A): Task<E, A> {
	return Task((_, res) => void res(value));
}

export function rejected<E, A>(err: E): Task<E, A> {
	return Task((rej, _) => void rej(err));
}

/* === Task === */
export interface Task<E, A> extends TaskImpl<E, A> {}
export const Task = Object.assign(
	function Task<E, A>(fork: TaskRunner<E, A>): Task<E, A> {
		return new TaskImpl(fork);
	},
	{ of, rejected }
);
