import { Either, Left, Right } from './Either';

type Cancel = () => void;
type Handler<T> = (_: T) => void;
type RunInput<E, A> = (handler: Handler<Either<E, A>>) => void | Cancel;
abstract class Task$proto<E, A> {
	abstract run(handler: Handler<Either<E, A>>): Cancel;
	alt(that: Task<E, A>): Task<E, A> {
		return Task(handler => {
			let isDone = false;
			const guard = <T = never>(f: Handler<T>) => (value: T) => {
				if (isDone) return;
				isDone = true;
				f(value);
			};

			let cancelThat = noop;
			const cancelThis = this.run(
				guard(reason => {
					handler(reason);
					cancelThat();
				})
			);
			cancelThat = that.run(
				guard(reason => {
					handler(reason);
					cancelThis();
				})
			);
			if (isDone) {
				cancelThat();
			}
			return guard(() => {
				cancelThis();
				cancelThat();
			}) as Cancel;
		});
	}
	ap<B>(that: Task<E, (_: A) => B>): Task<E, B> {
		type F = (_: A) => B;
		return Task(handler => {
			let isDone = false;
			const guard = <T = never>(f: Handler<T>) => (value: T) => {
				if (isDone) return;
				isDone = true;
				f(value);
			};
			let a: false | [A] = false;
			let f: false | [F] = false;

			let cancelThat = noop;
			const cancelThis = this.run(either => {
				if (isDone) return;
				if (either.isLeft) {
					isDone = true;
					handler(either as Left<E>);
					cancelThat();
					return;
				}
				a = [either.rightValue];
				if (f !== false) {
					handler(Right(f[0](a[0])));
				}
			});
			cancelThat = that.run(either => {
				if (isDone) return;
				if (either.isLeft) {
					isDone = true;
					handler(either as Left<E>);
					cancelThis();
					return;
				}
				f = [either.rightValue];
				if (a !== false) {
					handler(Right(f[0](a[0])));
				}
			});
			if (isDone) {
				cancelThat();
			}
			return guard(() => {
				cancelThis();
				cancelThat();
			}) as Cancel;
		});
	}
	bimap<B, C>(f: (_: E) => B, g: (_: A) => C): Task<B, C> {
		return Task(handler => this.run(either => handler(either.bimap(f, g))));
	}
	chain<B>(f: (_: A) => Task<E, B>): Task<E, B> {
		return Task(handler => {
			let cancelNext: Cancel = noop;
			const cancel = this.run(either => {
				if (either.isLeft) {
					handler(either as Left<E>);
				} else {
					cancelNext = f(either.rightValue).run(handler);
				}
			});
			return () => {
				cancel();
				cancelNext();
			};
		});
	}
	map<B>(f: (_: A) => B): Task<E, B> {
		return Task(handler => this.run(either => handler(either.map(f))));
	}
	mapRejected<B>(f: (_: E) => B): Task<B, A> {
		return Task(handler => this.run(either => handler(either.mapLeft(f))));
	}
	orElse<B>(f: (_: E) => Task<B, A>): Task<B, A> {
		return Task(handler => {
			let cancelNext: Cancel = noop;
			const cancel = this.run(either => {
				if (!either.isLeft) {
					handler(either as Right<A>);
				} else {
					cancelNext = f(either.leftValue).run(handler);
				}
			});
			return () => {
				cancel();
				cancelNext();
			};
		});
	}
}
const Task$static = {
	of<E, A>(value: A): Task<E, A> {
		return Task(handler => handler(Either.of(value)));
	},
	liftEither<E, A>(either: Either<E, A>): Task<E, A> {
		return Task(handler => handler(either));
	},
	rejected<E, A>(value: E): Task<E, A> {
		return Task(handler => handler(Left(value)));
	},
	zero<E = never, A = never>(): Task<E, A> {
		return Task(noop);
	},
};
export interface Task<E, A> extends Task$proto<E, A> {}
type Task$static = typeof Task$static;
interface TaskConstructor extends Task$static {
	new <E, A>(fork: RunInput<E, A>): Task<E, A>;
	<E, A>(fork: RunInput<E, A>): Task<E, A>;
}
export const Task: TaskConstructor = (() => {
	function Task<E, A>(run: RunInput<E, A>) {
		const task: Task<E, A> = Object.create(Task.prototype);
		task.run = handler => {
			let isDone = false;
			const guard = <T>(f: (x: T) => void) => (x: T): void => {
				if (isDone) return;
				isDone = true;
				f(x);
			};
			const cancel = run(guard(handler)) || noop;
			return guard(cancel) as Cancel;
		};
		return task;
	}
	Task.prototype = Object.create(Task$proto.prototype);
	Task.prototype.constructor = Task;
	return Object.assign(Task, Task$static) as any;
})();

function noop() {}

declare module './Foldable' {
	interface Foldable<A> {
		traverse<E, B>(A: typeof Task, f: (_: A) => Task<E, B>): Task<E, Foldable<B>>;
	}
	interface FoldableConstructor {
		sequence<E, A>(A: typeof Task, as: Foldable<Task<E, A>>): Task<E, Foldable<A>>;
	}
}

declare module './liftA' {
	export function liftA1<E, A, B>(f: (a: A) => B, fa: Task<E, A>): Task<E, B>;
	export function liftA2<E, A, B, C>(
		f: (a: A, b: B) => C,
		fa: Task<E, A>,
		fb: Task<E, B>
	): Task<E, C>;
	export function liftA3<E, A, B, C, D>(
		f: (a: A, b: B, c: C) => D,
		fa: Task<E, A>,
		fb: Task<E, B>,
		fc: Task<E, C>
	): Task<E, D>;
	export function liftA4<Er, A, B, C, D, E>(
		f: (a: A, b: B, c: C, d: D) => E,
		fa: Task<Er, A>,
		fb: Task<Er, B>,
		fc: Task<Er, C>,
		fd: Task<Er, D>
	): Task<Er, E>;
}
