import { Either } from './Either';
import { Task } from '../Task/Task';

export const toTask = <L, R>(either: Either<L, R>): Task<L, R> => Task(either);
