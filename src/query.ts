import { Either, Left, Right } from './Either';

export function query<T extends Element>(
  selector: string,
  parent: ParentNode = document
): Either<Error, T> {
  const el = parent.querySelector<T>(selector);
  return el === null ? Left(new Error(`Elemento não encontrado: '${selector}'.`)) : Right(el);
}
