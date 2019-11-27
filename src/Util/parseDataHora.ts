import { Maybe, Nothing, Just } from 'adt-ts';

export function parseDataHora(texto: string): Maybe<Date> {
  const partes = texto.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/);
  if (partes === null) return Nothing;
  const [_, d, m, y, h, i, s] = partes.map(Number);
  const data = new Date(y, m - 1, d, h, i, s);
  if (
    d !== data.getDate() ||
    m !== data.getMonth() + 1 ||
    y !== data.getFullYear() ||
    h !== data.getHours() ||
    i !== data.getMinutes() ||
    s !== data.getSeconds()
  )
    return Nothing;
  return Just(data);
}
