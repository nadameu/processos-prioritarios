import { Promise$sequenceObject } from './Promise$sequenceObject';

test('Vazio', async () => {
  expect(await Promise$sequenceObject({})).toEqual({});
});

test('Um erro', async () => {
  await expect(Promise$sequenceObject({ erro: Promise.reject('Erro') })).rejects.toEqual({
    erro: 'Erro',
  });
});

test('Três erros', async () => {
  const erros = ['a', 'b', 'c'].map(key => {
    const erro = `Erro ${key}`;
    return { key, erro };
  });
  const object = Object.fromEntries(erros.map(({ key, erro }) => [key, erro]));
  const promiseObject = Object.fromEntries(
    erros.map(({ key, erro }) => [key, Promise.reject(erro)])
  );
  await expect(Promise$sequenceObject(promiseObject)).rejects.toEqual(object);
});

test('Um valor', async () => {
  await expect(Promise$sequenceObject({ valor: Promise.resolve(42) })).resolves.toEqual({
    valor: 42,
  });
});

test('Três valores', async () => {
  const valores = ['a', 'b', 'c'].map((key, i) => {
    const valor = i + 40;
    return { key, valor };
  });
  const object = Object.fromEntries(valores.map(({ key, valor }) => [key, valor]));
  const promiseObject = Object.fromEntries(
    valores.map(({ key, valor }) => [key, Promise.resolve(valor)])
  );
  await expect(Promise$sequenceObject(promiseObject)).resolves.toEqual(object);
});
