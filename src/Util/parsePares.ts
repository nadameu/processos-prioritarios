type StringDict = {
  [key: string]: string;
};
export function parsePares(pares: string[]): StringDict {
  return pares.reduce<StringDict>((obj, par) => {
    let nome, valores, valor;
    [nome, ...valores] = par.split('=');
    nome = unescape(nome);
    valor = unescape(valores.join('='));
    obj[nome] = valor;
    return obj;
  }, {});
}
