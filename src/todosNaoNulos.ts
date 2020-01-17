import { particionarNulos } from './particionarNulos';

export async function todosNaoNulos<a>(valores: (a | null)[]): Promise<a[]> {
  const { indicesNulos, validos } = particionarNulos(valores);
  if (indicesNulos.length > 0)
    throw new Error(`Erro(s) no(s) índice(s) ${indicesNulos.join(', ')}.`);
  return validos;
}
