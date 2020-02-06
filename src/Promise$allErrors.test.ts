import { Promise$allErrors } from './Promise$allErrors';

test('Vazio', async () => {
  expect(await Promise$allErrors([])).toEqual([]);
});

test('Um erro', async () => {
  await expect(Promise$allErrors([Promise.reject('Erro')])).rejects.toEqual(['Erro']);
});

test('Três erros', async () => {
  const erros = [1, 2, 3].map(erro => `Erro ${erro}`);
  await expect(Promise$allErrors(erros.map(erro => Promise.reject(erro)))).rejects.toEqual(erros);
});

test('Um valor', async () => {
  expect(await Promise$allErrors([Promise.resolve(42)])).toEqual([42]);
});

test('Três valores', async () => {
  const valores = [1, 2, 3];
  expect(await Promise$allErrors(valores.map(valor => Promise.resolve(valor)))).toEqual(valores);
});
