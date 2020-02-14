import { meusLocalizadores } from './paginas/meusLocalizadores';
import { relatorioGeralIframe } from './paginas/relatorioGeral';
import { textosPadraoIframe } from './paginas/textosPadrao';

export async function main() {
  const url = new URL(document.location.href);
  const params = url.searchParams;
  const acao = params.get('acao');
  if (window.top !== window) {
    // Iframe
    switch (acao) {
      case 'relatorio_geral_listar':
        return relatorioGeralIframe();

      case 'texto_padrao_listar':
        return textosPadraoIframe();

      default:
        break;
    }
  } else {
    // Página normal
    switch (acao) {
      case 'localizador_orgao_listar':
        // Não implementado
        return;

      case 'localizador_processos_lista':
        // Não implementado
        return;

      case 'relatorio_geral_listar':
        // Somente iframe
        return;

      case 'texto_padrao_listar':
        // Somente iframe
        return;

      case 'usuario_tipo_monitoramento_localizador_listar':
        return meusLocalizadores();

      default:
        if (params.get('acao_origem') === 'principal') {
          // Não implementado
          return;
        } else {
          break;
        }
    }
    throw new Error(`Ação desconhecida: ${acao}.`);
  }
}
