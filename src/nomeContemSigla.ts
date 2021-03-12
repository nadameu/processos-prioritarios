const caracteresIgnorados = /[./]/;

export function nomeContemSigla(sigla: string, nome: string): boolean {
  const [s, n] = [sigla, nome].map(x => x.toLowerCase()) as [string, string];
  let indiceAtual = -1;
  for (const caractere of s.split('')) {
    if (!caracteresIgnorados.test(caractere)) {
      indiceAtual = n.indexOf(caractere, indiceAtual) + 1;
      if (indiceAtual === 0) return false;
    }
  }
  return true;
}
