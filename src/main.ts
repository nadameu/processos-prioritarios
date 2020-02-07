import { meusLocalizadores } from './paginas/meusLocalizadores';

export async function main() {
  const url = new URL(document.location.href);
  const params = url.searchParams;
  const acao = params.get('acao');
  if (acao === 'usuario_tipo_monitoramento_localizador_listar') {
    return meusLocalizadores();
  } else if (acao === 'localizador_processos_lista') {
    return;
  } else if (acao === 'relatorio_geral_listar') {
    return;
  } else if (acao === 'localizador_orgao_listar') {
    return;
  }
  const acaoOrigem = params.get('acao_origem');
  if (acaoOrigem === 'principal') {
    return;
  }
  throw new Error(`Ação desconhecida: "${acao}".`);
}
