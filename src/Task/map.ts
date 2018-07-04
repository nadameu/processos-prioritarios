import { Task } from './Task';

export const map = <E, A, B>(f: (_: A) => B) => (
	task: Task<E, A>
): Task<E, B> => Task((rej, res) => task.run(rej, a => res(f(a))));
