import { meusLocalizadores } from './paginas/meusLocalizadores';

export async function main() {
  const url = new URL(document.location.href);
  const params = url.searchParams;
  const acao = params.get('acao');
  if (acao === 'usuario_tipo_monitoramento_localizador_listar') {
    return meusLocalizadores();
  } else if (acao === 'localizador_processos_lista') {
    return 'Nada a fazer.';
  } else if (acao === 'relatorio_geral_listar') {
    return 'Nada a fazer.';
  } else if (acao === 'localizador_orgao_listar') {
    return 'Nada a fazer.';
  }
  const acaoOrigem = params.get('acao_origem');
  if (acaoOrigem === 'principal') {
    return 'Principal';
  }
  throw new Error(`Ação desconhecida: "${acao}".`);
}
