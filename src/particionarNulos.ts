export function particionarNulos<a>(
  valores: (a | null)[]
): {
  validos: a[];
  indicesNulos: number[];
} {
  const validos: a[] = [];
  const indicesNulos: number[] = [];
  valores.forEach((x, i) => {
    if (x === null) indicesNulos.push(i);
    else validos.push(x);
  });
  return { validos, indicesNulos };
}
