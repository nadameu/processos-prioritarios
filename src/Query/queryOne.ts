import { Either } from '../../adt/Either';
const { Left, Right } = Either;

export const queryOne = <T extends Element>(
	selector: string,
	context: NodeSelector
): Either<Error, T> => {
	const elts = context.querySelectorAll<T>(selector);
	if (elts.length === 0) {
		return Left(
			new Error(`Nenhum elemento corresponde ao seletor '${selector}'.`)
		);
	}
	if (elts.length > 1) {
		return Left(
			new Error(`Mais de um elemento correspondem ao seletor '${selector}'.`)
		);
	}
	return Right(elts[0]);
};
