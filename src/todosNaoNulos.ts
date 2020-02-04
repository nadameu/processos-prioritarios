import { particionarNulos } from './particionarNulos';

export async function todosNaoNulos<a>(valores: (a | null)[]): Promise<a[]> {
  const { indicesNulos, validos } = particionarNulos(valores);
  if (indicesNulos.length === 1) throw new Error(`Erro no índice ${indicesNulos[0]}.`);
  if (indicesNulos.length > 1) throw new Error(`Erros nos índices ${indicesNulos.join(', ')}.`);
  return validos;
}
