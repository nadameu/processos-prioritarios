import { meusLocalizadores } from './paginas/meusLocalizadores';
import { relatorioGeral } from './paginas/relatorioGeral';
import { textosPadrao } from './paginas/textosPadrao';

export async function main() {
  const url = new URL(document.location.href);
  const params = url.searchParams;
  switch (params.get('acao')) {
    case 'localizador_orgao_listar':
    case 'localizador_processos_lista':
      return;

    case 'relatorio_geral_listar':
      return relatorioGeral();

    case 'texto_padrao_listar':
      return textosPadrao();

    case 'usuario_tipo_monitoramento_localizador_listar':
      return meusLocalizadores();
  }
  if (params.get('acao_origem') === 'principal') {
    return;
  }
  throw new Error(`Ação desconhecida.`);
}
