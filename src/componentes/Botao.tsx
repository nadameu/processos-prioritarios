import * as preact from 'preact';
import svg from '../../calendar-check.svg';
import { Array$traverseObject } from '../Array$traverseObject';
import { Cancelable } from '../Cancelable';
import { LocalizadorOrgao } from '../Localizador';
import { logger } from '../logger';
import { parsePaginaCadastroMeusLocalizadores } from '../paginas/cadastroMeusLocalizadores';
import { parsePaginaLocalizadoresOrgao } from '../paginas/localizadoresOrgao';
import { XHR } from '../XHR';
import { Aguarde } from './Aguarde';
import { MensagemErro } from './MensagemErro';
import { TabelaLocalizadores } from './TabelaLocalizadores';

export const Botao: preact.FunctionComponent<{
  areaTabela: Element;
  container: Element;
  tabela: Element;
  urlCadastro: string;
  urlLocalizadoresOrgao: string;
}> = ({ areaTabela, container, tabela, urlCadastro, urlLocalizadoresOrgao }) => {
  return (
    <button
      type="button"
      class="summa-dies__botao"
      onClick={() => onClick()}
      dangerouslySetInnerHTML={{ __html: `${svg}Summa Dies` }}
    />
  );

  async function onClick() {
    try {
      preact.render(<Aguarde />, container);
      const [{ ocultarVazios, localizadores: meus }, orgao] = await Cancelable.all([
        XHR(urlCadastro).then(parsePaginaCadastroMeusLocalizadores),
        obterPaginaLocalizadoresOrgao(urlLocalizadoresOrgao).then(parsePaginaLocalizadoresOrgao),
      ]);
      const idsOrgao = new Map(orgao.map(loc => [loc.id, loc]));
      const { desativados, localizadores } = Array$traverseObject(meus, ({ id, siglaNome }) =>
        idsOrgao.has(id)
          ? { localizadores: idsOrgao.get(id) as LocalizadorOrgao }
          : { desativados: siglaNome }
      );
      if (desativados) {
        throw new Error(`Os seguintes localizadores foram desativados: ${desativados.join(', ')}`);
      }
      const dados = ocultarVazios
        ? localizadores!.filter(({ quantidadeProcessos }) => quantidadeProcessos > 0)
        : localizadores!;
      container.textContent = '';
      preact.render(<TabelaLocalizadores dados={dados} />, areaTabela, tabela);
    } catch (e) {
      logger.error(e);
      preact.render(
        <MensagemErro>{e instanceof Error ? e.message : String(e)}</MensagemErro>,
        container
      );
    }
  }
};

function obterPaginaLocalizadoresOrgao(url: string) {
  const data = new FormData();
  data.append('hdnInfraCampoOrd', 'TotalProcessos');
  data.append('hdnInfraTipoOrd', 'DESC');
  data.append('hdnInfraPaginaAtual', '0');
  data.append('chkOcultarSemProcesso', '0');
  return XHR(url, 'POST', data);
}
