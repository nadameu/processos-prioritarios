import { Task } from './Task';

export const chain = <E, A, B>(f: (_: A) => Task<E, B>) => (
	task: Task<E, A>
): Task<E, B> => Task((rej, res) => task.run(rej, a => f(a).run(rej, res)));
