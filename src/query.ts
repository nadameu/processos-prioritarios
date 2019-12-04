import { Either, Left, Right } from './Either';

export function query<T extends Element>(
  selector: string,
  parent: ParentNode = document
): Either<string, T> {
  const el = parent.querySelector<T>(selector);
  return el === null ? Left(`Elemento não encontrado: '${selector}'.`) : Right(el);
}
