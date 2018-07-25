type Cancel = () => void;
type Handler<T> = (_: T) => void;
type Fork<E, A> = (onReject: Handler<E>, onResolve: Handler<A>) => Cancel;
type ForkInput<E, A> = (
	onReject: Handler<E>,
	onResolve: Handler<A>
) => void | Cancel;
abstract class TaskBase<E, A> {
	abstract fork: Fork<E, A>;
	protected _constructor(fork: ForkInput<E, A>) {
		this.fork = (rej, res) => {
			let isDone = false;
			let cancel: Cancel = noop;
			const guard = <T = never>(f: Handler<T> = noop) => (value: T) => {
				if (isDone) return;
				isDone = true;
				f(value);
				cancel();
			};
			const newCancel = fork(guard(rej), guard(res));
			if (typeof newCancel === 'function') cancel = newCancel;
			return guard() as Cancel;
		};
	}
	ap<B>(that: Task<E, (_: A) => B>): Task<E, B> {
		type F = (_: A) => B;
		return Task((rej, res) => {
			let isDone = false;
			const guard = <T = never>(f: Handler<T> = noop) => (value: T) => {
				if (isDone) return;
				isDone = true;
				f(value);
			};
			let a: false | [A] = false;
			let f: false | [F] = false;

			let cancelThis = noop;
			let cancelThat = noop;
			cancelThis = this.fork(
				guard(reason => {
					rej(reason);
					cancelThat();
				}),
				value => {
					if (isDone) return;
					a = [value];
					if (f !== false) {
						res(f[0](value));
					}
				}
			);
			cancelThat = that.fork(
				guard(reason => {
					rej(reason);
					cancelThis();
				}),
				value => {
					if (isDone) return;
					f = [value];
					if (a !== false) {
						res(value(a[0]));
					}
				}
			);
			return guard(() => {
				cancelThis();
				cancelThat();
			}) as Cancel;
		});
	}
	chain<B>(f: (_: A) => Task<E, B>): Task<E, B> {
		return Task((rej, res) => {
			let cancelNext: Cancel = noop;
			const cancel = this.fork(rej, a => {
				cancelNext = f(a).fork(rej, res);
			});
			return () => {
				cancelNext();
				cancel();
			};
		});
	}
	map<B>(f: (_: A) => B): Task<E, B> {
		return Task((rej, res) => this.fork(rej, a => res(f(a))));
	}
	mapRejected<B>(f: (_: E) => B): Task<B, A> {
		return Task((rej, res) => this.fork(e => rej(f(e)), res));
	}
	orElse<B>(f: (_: E) => Task<B, A>): Task<B, A> {
		return Task((rej, res) => {
			let cancelNext: Cancel = noop;
			const cancel = this.fork(e => {
				cancelNext = f(e).fork(rej, res);
			}, res);
			return () => {
				cancelNext();
				cancel();
			};
		});
	}

	static of<E, A>(value: A): Task<E, A> {
		return Task((_, res) => res(value));
	}
	static rejected<E, A>(value: E): Task<E, A> {
		return Task(rej => rej(value));
	}
}
export interface Task<E, A> extends TaskBase<E, A> {}
type C = typeof TaskBase;
interface TaskConstructor extends C {
	new <E, A>(fork: ForkInput<E, A>): Task<E, A>;
	<E, A>(fork: ForkInput<E, A>): Task<E, A>;
}
export const Task: TaskConstructor = (() => {
	const Task: any = function Task<E, A>(fork: ForkInput<E, A>): Task<E, A> {
		const ret = Object.create(Task.prototype);
		Task.prototype._constructor.call(ret, fork);
		return ret;
	};
	Task.prototype = Object.create(TaskBase.prototype);
	Task.prototype.constructor = Task;
	const keys = Object.getOwnPropertyNames(
		TaskBase
	) as (keyof TaskConstructor)[];
	const doNotInclude = ['prototype', 'name', 'length'];
	keys.filter(k => !doNotInclude.includes(k)).forEach(key => {
		Task[key] = TaskBase[key];
	});
	return Task;
})();

function noop() {}
