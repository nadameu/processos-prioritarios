// ==UserScript==
// @name Processos prioritários
// @namespace   http://nadameu.com.br/processos-prioritarios
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br/eproc(V2|2trf4)/controlador\.php\?acao\=usuario_tipo_monitoramento_localizador_listar\&/
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br/eproc(V2|2trf4)/controlador\.php\?acao\=localizador_processos_lista\&/
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br/eproc(V2|2trf4)/controlador\.php\?acao\=localizador_orgao_listar\&/
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br/eproc(V2|2trf4)/controlador\.php\?acao\=relatorio_geral_listar\&/
// @include     /^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br/eproc(V2|2trf4)/controlador\.php\?acao\=[^&]+\&acao_origem=principal\&/
// @version 25
// @grant none
// ==/UserScript==

/* eslint-env es6, browser */

const CompetenciasCorregedoria = {
  JUIZADO: 1,
  CIVEL: 2,
  CRIMINAL: 3,
  EXECUCAO_FISCAL: 4
};
const Situacoes = {
  MOVIMENTO: 3,
  'MOVIMENTO-AGUARDA DESPACHO': 2,
  'MOVIMENTO-AGUARDA SENTENÇA': 4,
  INICIAL: 1,
  INDEFINIDA: 5
};
const GUI = (function() {
  let instance = null,
    construindo = false,
    button = null,
    progresso = null,
    saida = null;
  const invalidSymbols = /[&<>"]/g;
  const replacementSymbols = { '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot' };
  function safeHTML(strings, ...vars) {
    return vars.reduce(
      (result, variable, i) =>
        result +
        variable.replace(invalidSymbols, sym => `&${replacementSymbols[sym]};`) +
        strings[i + 1],
      strings[0]
    );
  }
  function GUI() {
    if (!construindo) {
      throw new Error('Classe deve ser instanciada usando o método .getInstance().');
    }
    const estilos = document.createElement('style');
    estilos.innerHTML = [
      'tr.infraTrEscura { background-color: #f0f0f0; }',
      '.gmProcessos { display: inline-block; margin: 0 0.25ex; padding: 0 0.5ex; font-weight: bold; min-width: 3.5ex; line-height: 1.5em; border: 2px solid transparent; border-radius: 1ex; text-align: center; color: black; }',
      '.gmProcessos.gmPrioridade0 { background-color: #ff8a8a; }',
      '.gmProcessos.gmPrioridade1 { background-color: #f84; }',
      '.gmProcessos.gmPrioridade2 { background-color: #ff8; }',
      '.gmProcessos.gmPrioridade3 { background-color: #8aff8a; }',
      '.gmProcessos.gmVazio { opacity: 0.25; background-color: inherit; color: #888; }',
      '.gmPeticoes { display: inline-block; margin-right: 1ex; width: 15px; height: 15px; line-height: 15px; background: red; color: white; border: 1px solid red; text-align: center; border-radius: 50%; font-size: 12px; }',
      '.gmPeticoes.gmVazio { visibility: hidden; }',
      '.gmDetalhes td:first-child { padding-left: 0; }',
      '.gmNaoMostrarClasses .gmDetalheClasse { display: none; }',
      '.gmNaoMostrarDiasParaFim .gmDiasParaFim { display: none; }',
      '.gmLocalizadorExtra { display: inline-block; float: right; background: #eee; border: 1px solid #aaa; color: #333; padding: 2px; margin: 0 3px 0 0; border-radius: 3px; font-size: 0.9em; }',
      '.gmBaloes { float: right; }',
      '.gmBotoesLocalizador { margin-right: 3ex; }',
      '.gmAtualizar { font-size: 1em; background: #ccc; padding: 4px; border-radius: 4px; margin-right: 1ex; }',
      '.gmFiltrar { font-size: 1em; background: #ccc; padding: 4px; border-radius: 4px; margin-right: 1ex; }',
      '.gmFiltrado .gmFiltrar { display: none; }',
      '.gmDetalhesAberto { transform: translateY(-2px); box-shadow: 0 2px 4px rgba(0,0,0,0.3); }',
      '.gmDetalhes meter { width: 10ex; }',
      '.gmDetalhes meter.gmExcesso { width: 20ex; }',
      '.gmLembreteProcesso { width: 2ex; height: 2ex; margin: 0 1ex; border-width: 0; }',
      '.gmLembreteProcessoVazio { opacity: 0; pointer-events: none; }',
      '.gmPorcentagem { display: inline-block; width: 6ex; text-align: right; }',
      '.gmPrioridade { display: none; color: red; }',
      '.gmPrazoMetade .gmPrioridade { display: inline; }'
    ].join('\n');
    document.querySelector('head').appendChild(estilos);
  }
  GUI.prototype = {
    constructor: GUI,
    atualizarVisualizacao(localizador, filtrado = false) {
      const linha = localizador.linha;
      const DIAS_A_FRENTE = 3;
      const avisos = [
        'Processos com prazo excedido em dobro',
        'Processos com prazo vencido',
        `Processos com prazo a vencer nos próximos ${DIAS_A_FRENTE} dias`,
        'Processos no prazo'
      ];
      const MILISSEGUNDOS_EM_UM_DIA = 864e5;
      const ULTIMA_HORA = 23;
      const ULTIMO_MINUTO = 59;
      const ULTIMO_SEGUNDO = 59;
      const ULTIMO_MILISSEGUNDO = 999;
      const agora = new Date();
      const aVencer = new Date(
        agora.getFullYear(),
        agora.getMonth(),
        agora.getDate() + DIAS_A_FRENTE,
        ULTIMA_HORA,
        ULTIMO_MINUTO,
        ULTIMO_SEGUNDO,
        ULTIMO_MILISSEGUNDO
      );
      const atrasoAVencer = (agora.getTime() - aVencer.getTime()) / MILISSEGUNDOS_EM_UM_DIA;
      const prioridades = [
        localizador.processos.filter(processo => processo.atrasoPorcentagem >= 1),
        localizador.processos.filter(
          processo => processo.atraso >= 0 && processo.atrasoPorcentagem < 1
        ),
        localizador.processos.filter(
          processo => processo.atraso < 0 && processo.atraso >= atrasoAVencer
        ),
        localizador.processos.filter(processo => processo.atraso < atrasoAVencer)
      ];
      const baloes = prioridades.map((processos, indicePrioridade) => {
        return `<span id="gmLocalizador${
          localizador.id
        }Prioridade${indicePrioridade}" class="gmProcessos gmPrioridade${indicePrioridade}${
          processos.length > 0 ? '' : ' gmVazio'
        }" onmouseover="infraTooltipMostrar(&quot;${
          avisos[indicePrioridade]
        }&quot;);" onmouseout="infraTooltipOcultar();">${processos.length}</span>`;
      });
      const conteudo = [];
      if (!(localizador.sigla || localizador.nome)) {
        conteudo.push(localizador.siglaNome);
      } else if (localizador.sigla) {
        if (localizador.nome !== localizador.sigla) {
          if (isContained(localizador.sigla, localizador.nome)) {
            conteudo.push(localizador.nome);
          } else {
            conteudo.push(`${localizador.sigla} (${localizador.nome})`);
          }
        } else {
          conteudo.push(localizador.sigla);
        }
      } else {
        conteudo.push(localizador.nome);
      }
      if (localizador.lembrete) {
        conteudo.push(' ');
        conteudo.push(
          `<img class="infraImgNormal" src="../../../infra_css/imagens/balao.gif" style="width:0.9em; height:0.9em; opacity:1; border-width:0;" onmouseover="${safeHTML`return infraTooltipMostrar('${localizador.lembrete}','',400);`}" onmouseout="return infraTooltipOcultar();"/>`
        );
      }
      const processosComPeticao = localizador.processos.filter(processo => {
        const localizadoresPeticao = processo.localizadores.filter(
          localizadorProcesso =>
            localizadorProcesso.sigla === 'PETIÇÃO' ||
            localizadorProcesso.sigla === 'SUSPENSOS-RETORNO'
        );
        return localizadoresPeticao.length > 0;
      });
      const OCULTAR_BALOES_COM_MAIS_DE = 99;
      baloes.unshift(
        `<span id="gmLocalizador${localizador.id}Peticoes" class="gmPeticoes${
          processosComPeticao.length > 0 ? '' : ' gmVazio'
        }" onmouseover="infraTooltipMostrar(&quot;Processos com localizador PETIÇÃO ou SUSPENSOS-RETORNO&quot;);" onmouseout="infraTooltipOcultar();">${
          processosComPeticao.length > OCULTAR_BALOES_COM_MAIS_DE ? '+' : processosComPeticao.length
        }</span>`
      );
      conteudo.push('<div class="gmBaloes">');
      conteudo.push(baloes.join(''));
      conteudo.push('</div>');
      linha.cells[0].innerHTML = conteudo.join('');
      if (localizador.quantidadeProcessosNaoFiltrados > 0) {
        const container = document.createElement('span');
        container.className = 'gmBotoesLocalizador';
        if (filtrado) {
          linha.classList.add('gmFiltrado');
        } else {
          linha.classList.remove('gmFiltrado');
          const filtrar = document.createElement('a');
          filtrar.setAttribute(
            'onmouseover',
            'infraTooltipMostrar("Excluir processos com prazos em aberto.");'
          );
          filtrar.setAttribute('onmouseout', 'infraTooltipOcultar();');
          filtrar.setAttribute('onclick', 'infraTooltipOcultar();');
          filtrar.className = 'gmFiltrar';
          filtrar.textContent = 'Filtrar';
          filtrar.addEventListener(
            'click',
            evt => {
              evt.preventDefault();
              evt.stopPropagation();
              Array.from(document.getElementsByClassName('gmDetalhesAberto')).forEach(
                balaoAberto => {
                  let linhaAberta = balaoAberto.parentElement;
                  while (linhaAberta && linhaAberta.tagName.toLowerCase() !== 'tr')
                    linhaAberta = linhaAberta.parentElement;
                  if (linhaAberta && linhaAberta === linha) {
                    balaoAberto.classList.remove('gmDetalhesAberto');
                    Array.from(document.getElementsByClassName('gmDetalhes')).forEach(
                      linhaAntiga => {
                        linha.parentElement.removeChild(linhaAntiga);
                      }
                    );
                  }
                }
              );
              const gui = GUI.getInstance();
              gui.avisoCarregando.exibir('Filtrando processos com prazo em aberto...');
              gui.avisoCarregando.atualizar(0, localizador.quantidadeProcessos);
              localizador.excluirPrazosAbertos().then(() => {
                gui.avisoCarregando.ocultar();
                gui.atualizarVisualizacao(localizador, true);
                gui.atualizarGrafico();
              });
            },
            false
          );
          container.appendChild(filtrar);
        }
        const atualizar = document.createElement('a');
        atualizar.className = 'gmAtualizar';
        atualizar.textContent = 'Atualizar';
        atualizar.addEventListener(
          'click',
          evt => {
            evt.preventDefault();
            evt.stopPropagation();
            Array.from(document.getElementsByClassName('gmDetalhesAberto')).forEach(balaoAberto => {
              let linhaAberta = balaoAberto.parentElement;
              while (linhaAberta && linhaAberta.tagName.toLowerCase() !== 'tr')
                linhaAberta = linhaAberta.parentElement;
              if (linhaAberta && linhaAberta === linha) {
                balaoAberto.classList.remove('gmDetalhesAberto');
                Array.from(document.getElementsByClassName('gmDetalhes')).forEach(linhaAntiga => {
                  linha.parentElement.removeChild(linhaAntiga);
                });
              }
            });
            const gui = GUI.getInstance();
            gui.avisoCarregando.exibir('Atualizando...');
            gui.avisoCarregando.atualizar(0, localizador.quantidadeProcessosNaoFiltrados);
            localizador.obterProcessos().then(() => {
              gui.avisoCarregando.ocultar();
              gui.atualizarVisualizacao(localizador);
              gui.atualizarGrafico();
            });
          },
          false
        );
        container.appendChild(atualizar);
        const divExistente = linha.cells[0].querySelector('div');
        divExistente.insertBefore(container, divExistente.firstChild);
      }
      function alternarDetalhes(balao, processos, indicePrioridade) {
        Array.from(document.getElementsByClassName('gmDetalhes')).forEach(linhaAntiga => {
          linha.parentElement.removeChild(linhaAntiga);
        });
        if (balao.classList.contains('gmDetalhesAberto')) {
          balao.classList.remove('gmDetalhesAberto');
          return;
        }
        Array.from(document.getElementsByClassName('gmDetalhesAberto')).forEach(balaoAberto => {
          balaoAberto.classList.remove('gmDetalhesAberto');
        });
        balao.classList.add('gmDetalhesAberto');
        const MENOR = -1,
          MAIOR = +1;
        processos.sort((a, b) => {
          if (a.termoPrazoCorregedoria < b.termoPrazoCorregedoria) return MENOR;
          if (a.termoPrazoCorregedoria > b.termoPrazoCorregedoria) return MAIOR;
          return 0;
        });
        processos.forEach((processo, indiceProcesso) => {
          const linhaNova = linha.parentElement.insertRow(linha.rowIndex + 1 + indiceProcesso);
          const atraso = Math.round(processo.atraso);
          linhaNova.className = 'infraTrClara gmDetalhes';
          const DIGITOS_CLASSE = 6,
            DIGITOS_COMPETENCIA = 2;
          linhaNova.dataset.classe = ('0'.repeat(DIGITOS_CLASSE) + processo.numClasse).substr(
            -DIGITOS_CLASSE
          );
          linhaNova.dataset.competencia = (
            '0'.repeat(DIGITOS_COMPETENCIA) + processo.numCompetencia
          ).substr(-DIGITOS_COMPETENCIA);
          let textoData;
          switch (processo.campoDataConsiderada) {
            case 'dataSituacao':
              switch (processo.situacao) {
                case 'MOVIMENTO-AGUARDA DESPACHO':
                  textoData = 'Data da conclusão para despacho';
                  break;
                case 'MOVIMENTO-AGUARDA SENTENÇA':
                  textoData = 'Data da conclusão para sentença';
                  break;
                default:
                  textoData = 'Data de alteração da situação';
                  break;
              }
              break;
            case 'dataUltimoEvento':
              textoData = 'Data do último evento';
              break;
            case 'dataInclusaoLocalizador':
              textoData = 'Data de inclusão no localizador';
              break;
            default:
              throw new Error('Campo "data considerada" desconhecido.');
          }
          const MAXIMO_PRIORIDADE_MENOR_OU_IGUAL_A_UM = 2,
            MAXIMO_PRIORIDADE_DOIS_OU_MAIOR = 1,
            DIAS_BAIXO = 3,
            IDEAL = 0.5;
          let indicePrioridadeProcesso = indicePrioridade;
          if (typeof indicePrioridade === 'undefined') {
            prioridades.forEach((processos, indice) => {
              if (processos.includes(processo)) {
                indicePrioridadeProcesso = indice;
              }
            });
          }
          const esperado = processo.prazoCorregedoria;
          const minimo = 0;
          const maximo =
            esperado *
            (indicePrioridadeProcesso > 1
              ? MAXIMO_PRIORIDADE_DOIS_OU_MAIOR
              : MAXIMO_PRIORIDADE_MENOR_OU_IGUAL_A_UM);
          const baixo = esperado - DIAS_BAIXO;
          const alto = esperado;
          const ideal = esperado * IDEAL;
          const valor = esperado + atraso;
          const PCT = 100;
          const porcentagem = `${Math.round(PCT + processo.atrasoPorcentagem * PCT)}%`;
          const localizadoresExtra = processo.localizadores
            .filter(loc => loc.id !== localizador.id)
            .map(loc => loc.sigla);
          linhaNova.innerHTML = [
            '<td>',
            safeHTML`<img class="gmLembreteProcesso${
              processo.lembretes.length === 0 ? ' gmLembreteProcessoVazio' : ''
            }" src="../../../infra_css/imagens/balao.gif" onmouseover="return infraTooltipMostrar('${processo.lembretes
              .map(lembrete => lembrete.replace(/\n/g, '<br>'))
              .join(
                '<hr style="border-width: 0 0 1px 0;">'
              )}', 'Lembretes', 400);" onmouseout="return infraTooltipOcultar();">`,
            [
              `<a href="${processo.link}">${processo.numprocFormatado}</a>`,
              `<abbr title="${textoData}">${processo[processo.campoDataConsiderada]
                .toLocaleString()
                .substr(0, 10)}</abbr> + ${esperado.toString().replace(/\.5$/, '&half;')}${
                esperado >= 2 ? ' dias' : ' dia'
              } = ${processo.termoPrazoCorregedoria.toLocaleString().substr(0, 10)}`
            ].join(' | '),
            `<span class="gmDetalheClasse"> | ${processo.classe.toUpperCase()}</span>`,
            localizadoresExtra.length > 0
              ? localizadoresExtra
                  .map(loc => `<span class="gmLocalizadorExtra">${loc}</span>`)
                  .join(' ')
              : '',
            '</td>',
            '<td>',
            `<meter ${
              indicePrioridadeProcesso < 2 ? ' class="gmExcesso"' : ''
            } min="${minimo}" max="${maximo}" low="${baixo}" high="${alto}" optimum="${ideal}" value="${valor}">${atraso}</meter>`,
            `<span class="gmPorcentagem">${porcentagem}</span><span class="gmDiasParaFim"> | ${
              processo.atraso >= 0 ? 'Prazo excedido há ' : ''
            }`,
            Math.abs(atraso) < 1
              ? processo.atraso >= 0
                ? 'menos de um'
                : 'Menos de um'
              : Math.abs(atraso),
            Math.abs(atraso) > 1 ? ' dias ' : ' dia ',
            processo.atraso < 0 ? 'até o fim do prazo' : '',
            processo.prioridade ? '</span> <span class="gmPrioridade">(Prioridade)</span>' : '',
            '</td>'
          ].join('');
        });
      }
      prioridades.forEach((processos, indicePrioridade) => {
        const balao = document.getElementById(
          `gmLocalizador${localizador.id}Prioridade${indicePrioridade}`
        );
        balao.addEventListener(
          'click',
          evt => {
            evt.preventDefault();
            evt.stopPropagation();
            alternarDetalhes(balao, processos, indicePrioridade);
          },
          false
        );
      });
      const balaoPeticoes = document.getElementById(`gmLocalizador${localizador.id}Peticoes`);
      balaoPeticoes.addEventListener(
        'click',
        evt => {
          evt.preventDefault();
          evt.stopPropagation();
          alternarDetalhes(balaoPeticoes, processosComPeticao);
        },
        false
      );
    },
    avisoCarregando: {
      acrescentar(qtd) {
        if (!progresso || !saida) {
          throw new Error('Aviso ainda não foi exibido.');
        }
        const atual = progresso.value,
          total = progresso.max;
        this.atualizar(atual + qtd, total);
      },
      atualizar(atual, total) {
        if (!progresso || !saida) {
          this.exibir();
        }
        progresso.max = total;
        progresso.value = atual;
        saida.textContent = `${atual} / ${total}`;
      },
      exibir(texto = 'Carregando dados dos processos...') {
        window.infraExibirAviso(
          false,
          [
            '<center>',
            `${texto}<br/>`,
            '<progress id="gmProgresso" value="0" max="1"></progress><br/>',
            '<output id="gmSaida"></output>',
            '</center>'
          ].join('')
        );
        progresso = document.getElementById('gmProgresso');
        saida = document.getElementById('gmSaida');
      },
      ocultar() {
        window.infraOcultarAviso();
        progresso = null;
        saida = null;
      }
    },
    criarBotaoAcao(localizadores) {
      const frag = document.createDocumentFragment();
      const area = document.getElementById('divInfraAreaTelaD');
      button = document.createElement('button');
      button.textContent = 'Analisar conteúdo dos localizadores';
      frag.appendChild(button);
      frag.appendChild(document.createElement('br'));
      function criarCheckboxMostrar(id, padrao, [classeTrue, classeFalse], texto) {
        const input = document.createElement('input');
        input.type = 'checkbox';
        function onChange() {
          localStorage.setItem(id, input.checked ? 'S' : 'N');
          if (input.checked) {
            if (classeFalse !== '') document.body.classList.remove(classeFalse);
            if (classeTrue !== '') document.body.classList.add(classeTrue);
          } else {
            if (classeTrue !== '') document.body.classList.remove(classeTrue);
            if (classeFalse !== '') document.body.classList.add(classeFalse);
          }
        }
        input.checked = localStorage.hasOwnProperty(id) ? localStorage.getItem(id) === 'S' : padrao;
        input.addEventListener('click', onChange);
        const gui = GUI.getInstance();
        input.addEventListener('click', () => {
          Array.from(document.querySelectorAll('.gmDetalhes')).forEach(detalhe =>
            detalhe.parentNode.removeChild(detalhe)
          );
          localizadores.forEach(localizador => gui.atualizarVisualizacao(localizador));
          if (typeof gui.atualizarGrafico === 'function') gui.atualizarGrafico();
        });
        onChange();
        const label = document.createElement('label');
        label.textContent = texto;
        label.insertBefore(input, label.firstChild);
        return label;
      }
      const labelClasses = criarCheckboxMostrar(
        'mostrarClasses',
        true,
        ['', 'gmNaoMostrarClasses'],
        ' Mostrar classe dos processos'
      );
      frag.appendChild(labelClasses);
      frag.appendChild(document.createElement('br'));
      const labelDias = criarCheckboxMostrar(
        'mostrarDiasParaFim',
        true,
        ['', 'gmNaoMostrarDiasParaFim'],
        ' Mostrar dias para o fim do prazo'
      );
      frag.appendChild(labelDias);
      frag.appendChild(document.createElement('br'));
      const labelConsiderarDataInclusaoLocalizador = criarCheckboxMostrar(
        'considerarDataInclusaoLocalizador',
        false,
        ['gmConsiderarDataInclusaoLocalizador', ''],
        'Entre data do último evento e da inclusão no localizador, considerar a mais antiga'
      );
      frag.appendChild(labelConsiderarDataInclusaoLocalizador);
      frag.appendChild(document.createElement('br'));
      const labelPrazoMetade = criarCheckboxMostrar(
        'prazoMetade',
        true,
        ['gmPrazoMetade', ''],
        'Conceder metade do prazo normal para processos prioritários'
      );
      frag.appendChild(labelPrazoMetade);
      frag.appendChild(document.createElement('br'));
      area.insertBefore(frag, area.firstChild);
      return button;
    },
    atualizarBotaoAcao() {
      if (button) {
        button.textContent = 'Atualizar';
      }
    },
    criarGrafico(localizadores) {
      function excluirCanvasAntigo() {
        const canvases = document.getElementsByTagName('canvas');
        if (canvases.length > 0) {
          console.log('Excluindo canvas antigo');
          Array.from(canvases).forEach(canvas => canvas.parentNode.removeChild(canvas));
        }
      }
      function extrairProcessos(localizadores) {
        const processos = new Map();
        const agora = new Date(),
          hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
        localizadores.forEach(localizador => {
          localizador.processos.forEach(processo => {
            const numproc = processo.numproc;
            const termo = processo.termoPrazoCorregedoria,
              dataTermo = new Date(termo.getFullYear(), termo.getMonth(), termo.getDate());
            const timestamp = Math.max(hoje.getTime(), dataTermo.getTime());
            if (processos.has(numproc)) {
              const timestampAntigo = processos.get(numproc),
                timestampNovo = Math.min(timestampAntigo, timestamp);
              processos.set(numproc, timestampNovo);
            } else {
              processos.set(numproc, timestamp);
            }
          });
        });
        return processos;
      }
      function extrairDatas(processos) {
        const datas = new Map();
        for (const timestamp of processos.values()) {
          const valorAtual = datas.get(timestamp) || 0;
          datas.set(timestamp, valorAtual + 1);
        }
        return datas;
      }
      const Grafico = (function() {
        class Grafico {
          get area() {
            const area = {
              corFundo: 'rgba(102, 102, 102, 0.25)',
              linha: { espessura: 1, cor: '#666' }
            };
            const margemExterna =
              this.dimensoes.margem +
              this.linha.espessura / 2 +
              this.dimensoes.espacamento +
              area.linha.espessura / 2;
            area.margens = {
              t: margemExterna + this.texto.altura / 2,
              r: margemExterna,
              b: margemExterna + this.texto.altura + this.dimensoes.espacamento,
              l: margemExterna + this.escala.largura + 2 * this.dimensoes.espacamento
            };
            area.dimensoes = {
              largura: this.dimensoes.largura - area.margens.l - area.margens.r,
              altura: this.dimensoes.altura - area.margens.t - area.margens.b
            };
            return area;
          }
          constructor() {
            this.dimensoes = {
              get largura() {
                return Math.min(1024, document.querySelector('#divInfraAreaTelaD').clientWidth);
              },
              altura: 400,
              margem: 3,
              espacamento: 5
            };
            this.linha = { espessura: 1, cor: 'rgba(255, 255, 255, 0.9)' };
            this.corFundo = 'rgb(51, 51, 51)';
            this.texto = {
              altura: 10,
              cor: 'hsla(180, 100%, 87%, 0.87)',
              corSecundaria: 'hsla(180, 100%, 87%, 0.5)'
            };
            this.escala = {
              maximo: 20,
              unidadePrimaria: 10,
              unidadeSecundaria: 5,
              largura: 2 * this.texto.altura,
              linhaPrimaria: { espessura: 2, cor: '#888' },
              linhaSecundaria: { espessura: 0.5, cor: '#666' }
            };
            const self = this;
            this.categorias = {
              quantidade: 1,
              get distancia() {
                return self.area.dimensoes.largura / self.categorias.quantidade;
              }
            };
            this.barras = {
              corVencido: 'hsla(15, 80%, 75%, 1)',
              corProximosDias: 'hsla(60, 100%, 75%, 1)',
              corNoPrazo: 'hsla(120, 75%, 80%, 1)',
              espacamento: 0.2,
              /* valor entre 0 e 1, proporcional à largura disponível */ get largura() {
                return self.categorias.distancia * (1 - self.barras.espacamento);
              }
            };
            const canvas = document.createElement('canvas');
            canvas.width = this.dimensoes.largura;
            canvas.height = this.dimensoes.altura;
            this.canvas = canvas;
            this.context = this.canvas.getContext('2d');
            this.dados = new Map();
          }
          inserirDados(dados) {
            this.dados = dados;
          }
          render() {
            this.calcularEscala();
            this.calcularLarguraEscala();
            this.calcularCategorias();
            this.desenharFundo();
            this.desenharArea();
            this.desenharEscala();
            this.desenharCategorias();
            this.desenharBarras();
            return this.canvas;
          }
          desenharFundo() {
            const context = this.context;
            context.fillStyle = this.corFundo;
            context.fillRect(0, 0, this.dimensoes.largura, this.dimensoes.altura);
            context.beginPath();
            const x = this.dimensoes.margem;
            const y = x;
            const w = this.dimensoes.largura - 2 * this.dimensoes.margem;
            const h = this.dimensoes.altura - 2 * this.dimensoes.margem;
            context.rect(x, y, w, h);
            context.lineWidth = this.linha.espessura;
            context.strokeStyle = this.linha.cor;
            context.stroke();
          }
          desenharArea() {
            const context = this.context;
            context.beginPath();
            context.rect(
              this.area.margens.l,
              this.area.margens.t,
              this.area.dimensoes.largura,
              this.area.dimensoes.altura
            );
            context.fillStyle = this.area.corFundo;
            context.fill();
            context.lineWidth = this.area.linha.espessura;
            context.strokeStyle = this.area.linha.cor;
            context.stroke();
          }
          desenharEscala() {
            const context = this.context;
            const xTexto =
              this.dimensoes.margem +
              this.linha.espessura / 2 +
              this.dimensoes.espacamento +
              this.escala.largura / 2;
            const xLinha = xTexto + this.escala.largura / 2 + this.dimensoes.espacamento;
            const wLinha = this.area.dimensoes.largura + this.dimensoes.espacamento;
            for (let i = 0; i <= this.escala.maximo; i += this.escala.unidadeSecundaria) {
              if (i % this.escala.unidadePrimaria === 0) {
                context.fillStyle = this.texto.cor;
                context.strokeStyle = this.escala.linhaPrimaria.cor;
                context.lineWidth = this.escala.linhaPrimaria.espessura;
              } else {
                context.fillStyle = this.texto.corSecundaria;
                context.strokeStyle = this.escala.linhaSecundaria.cor;
                context.lineWidth = this.escala.linhaSecundaria.espessura;
              }
              const proporcao = i / this.escala.maximo;
              const y =
                this.dimensoes.altura -
                this.area.margens.b -
                proporcao * this.area.dimensoes.altura;
              context.fillText(i.toString(), xTexto, y);
              context.beginPath();
              context.moveTo(xLinha, y);
              context.lineTo(xLinha + wLinha, y);
              context.stroke();
            }
          }
          desenharCategorias() {
            const context = this.context;
            const larguraPossivelTexto = context.measureText('99').width;
            const step = Math.ceil(
              (larguraPossivelTexto + this.dimensoes.espacamento) / this.categorias.distancia
            );
            const agora = new Date(),
              hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
            context.fillStyle = this.texto.cor;
            const y =
              this.dimensoes.altura -
              (this.dimensoes.margem + this.linha.espessura / 2 + this.area.margens.b) / 2;
            for (let i = 0; i < this.categorias.quantidade; i += step) {
              const dia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
              const x = this.area.margens.l + (i + 0.5) * this.categorias.distancia;
              context.fillText(dia.getDate().toString(), x, y);
            }
          }
          desenharBarras() {
            const context = this.context;
            const agora = new Date(),
              hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
            const larguraBarra = this.categorias.distancia * (1 - this.barras.espacamento);
            for (let i = 0; i < this.categorias.quantidade; i++) {
              if (i === 0) {
                context.fillStyle = this.barras.corVencido;
              } else if (i <= 3) {
                context.fillStyle = this.barras.corProximosDias;
              } else {
                context.fillStyle = this.barras.corNoPrazo;
              }
              const dia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + i);
              if (this.dados.has(dia.getTime())) {
                const x =
                  this.area.margens.l + (i + 0.5) * this.categorias.distancia - larguraBarra / 2;
                const valor = this.dados.get(dia.getTime());
                const altura = (valor / this.escala.maximo) * this.area.dimensoes.altura;
                const y = this.dimensoes.altura - this.area.margens.b - altura;
                context.fillRect(x, y, larguraBarra, altura);
              }
            }
          }
          calcularEscala() {
            const quantidades = Array.from(this.dados.values());
            const maximo = Math.max.apply(null, quantidades);
            this.calcularDadosEscala(maximo);
            const distanciaMinima = 2 * this.dimensoes.espacamento + 2 * this.texto.altura;
            const secundariaOk = this.assegurarDistanciaMinima(
              'unidadeSecundaria',
              distanciaMinima
            );
            if (secundariaOk) return;
            const primariaOk = this.assegurarDistanciaMinima('unidadePrimaria', distanciaMinima);
            if (primariaOk) {
              this.escala.unidadeSecundaria = this.escala.unidadePrimaria;
            } else {
              throw new Error('Não sei o que fazer');
            }
          }
          calcularLarguraEscala() {
            const context = this.context;
            context.textBaseline = 'middle';
            context.textAlign = 'center';
            context.font = `${this.texto.altura}px Arial`;
            const largura = context.measureText(this.escala.maximo.toString()).width;
            this.escala.largura = largura;
          }
          calcularCategorias() {
            const dias = Array.from(this.dados.keys());
            const agora = new Date(),
              hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
            const minimo = hoje.getTime();
            const maximo = Math.max.apply(null, dias);
            const UM_DIA = 864e5;
            this.categorias.quantidade = (maximo - minimo) / UM_DIA + 1;
          }
          calcularDadosEscala(maximo) {
            if (maximo <= 10) {
              this.escala.unidadePrimaria = 10;
            } else {
              const ordem = Math.floor(Math.log(maximo) / Math.log(10));
              this.escala.unidadePrimaria = Math.pow(10, ordem);
            }
            this.escala.unidadeSecundaria = this.escala.unidadePrimaria / 10;
            this.escala.maximo =
              Math.ceil(maximo / this.escala.unidadeSecundaria) * this.escala.unidadeSecundaria;
          }
          assegurarDistanciaMinima(unidade, distancia) {
            let tamanhoIdealEncontrado = false;
            [1, 2, 2.5, 5, 10].forEach(mult => {
              if (tamanhoIdealEncontrado) return;
              const novoIntervalo = this.escala[unidade] * mult;
              if (novoIntervalo % 1 !== 0) return;
              const novoMaximo = Math.ceil(this.escala.maximo / novoIntervalo) * novoIntervalo;
              if ((novoMaximo / novoIntervalo) * distancia <= this.area.dimensoes.altura) {
                tamanhoIdealEncontrado = true;
                if (mult !== 1) {
                  this.escala[unidade] *= mult;
                  this.escala.maximo = novoMaximo;
                }
              }
            });
            return tamanhoIdealEncontrado;
          }
        }
        return Grafico;
      })();
      excluirCanvasAntigo();
      const processos = extrairProcessos(localizadores);
      const tabelaDatas = extrairDatas(processos);
      const grafico = new Grafico();
      grafico.inserirDados(tabelaDatas);
      document.getElementById('divInfraAreaTelaD').appendChild(grafico.render());
    },
    visitLocalizador(pvtVars) {
      return pvtVars;
    }
  };
  GUI.getInstance = function() {
    if (!instance) {
      construindo = true;
      instance = new GUI();
      construindo = false;
    }
    return instance;
  };
  return GUI;
})();
const LocalizadoresFactory = (function() {
  var obterFormularioRelatorioGeral = function() {
    const promiseRelatorioGeral = new Promise((resolve, reject) => {
      const links = document.querySelectorAll('#main-menu a[href]');
      const url = Array.from(links)
        .filter(link => new URL(link.href).searchParams.get('acao') === 'relatorio_geral_listar')
        .map(link => link.href)[0];
      const xml = new XMLHttpRequest();
      xml.open('GET', url);
      xml.responseType = 'document';
      xml.onerror = reject;
      xml.onload = resolve;
      xml.send(null);
    }).then(({ target: { response: doc } }) => {
      console.log('Página relatório geral obtida', doc);
      const consultar = doc.getElementById('btnConsultar');
      const form = consultar.form;
      return form;
    });
    obterFormularioRelatorioGeral = () => promiseRelatorioGeral;
    return obterFormularioRelatorioGeral();
  };
  function trataHTML({ target: { response: doc } }) {
    const pagina = Number(doc.getElementById('hdnInfraPaginaAtual').value);
    const quantidadeProcessosCarregados = parseInt(doc.getElementById('hdnInfraNroItens').value);
    const gui = GUI.getInstance();
    gui.avisoCarregando.acrescentar(quantidadeProcessosCarregados);
    const linhas = [
      ...doc.querySelectorAll('#divInfraAreaTabela > table > tbody > tr[class^="infraTr"]')
    ];
    linhas.forEach(function(linha) {
      this.processos.push(ProcessoFactory.fromLinha(linha));
    }, this);
    const proxima = doc.getElementById('lnkInfraProximaPaginaSuperior');
    if (proxima) {
      console.info('Buscando próxima página', this.nome || this.siglaNome);
      return this.obterPagina(pagina + 1, doc);
    }
    return this;
  }
  function Localizador() {
    this.id = null;
    this.linha = null;
    this.link = null;
    this.nome = null;
    this.processos = [];
    this.quantidadeProcessosNaoFiltrados = null;
    this.sigla = null;
    this.siglaNome = null;
  }
  Localizador.prototype = {
    constructor: Localizador,
    obterPagina(pagina, doc) {
      const self = this;
      return new Promise((resolve, reject) => {
        let url, data;
        if (pagina === 0) {
          url = self.link.href;
          data = new FormData();
          const camposPost = [
            'optchkcClasse',
            'optDataAutuacao',
            'optchkcUltimoEvento',
            'optNdiasSituacao',
            'optJuizo',
            'optPrioridadeAtendimento',
            'chkStatusProcesso'
          ];
          camposPost.forEach(campo => data.set(campo, 'S'));
          data.set('paginacao', '100');
          data.set('hdnInfraPaginaAtual', pagina);
        } else {
          doc.getElementById('selLocalizador').value = self.id;
          const paginaAtual = doc.getElementById('hdnInfraPaginaAtual');
          paginaAtual.value = pagina;
          let form = paginaAtual.parentElement;
          while (form.tagName.toLowerCase() !== 'form') {
            form = form.parentElement;
          }
          url = form.action;
          data = new FormData(form);
        }
        const xml = new XMLHttpRequest();
        xml.open('POST', url);
        xml.responseType = 'document';
        xml.onerror = reject;
        xml.onload = resolve;
        xml.send(data);
      })
        .then(trataHTML.bind(this))
        .catch(console.error.bind(console));
    },
    obterPrazosPagina(pagina = 0) {
      const self = this;
      return obterFormularioRelatorioGeral()
        .then(form => {
          const url = form.action;
          const method = form.method;
          const data = new FormData();
          data.set('paginacao', '100');
          data.set('selPrazo', 'A');
          data.set('selLocalizadorPrincipal', self.id);
          data.set('selLocalizadorPrincipalSelecionados', self.id);
          data.set('optchkcClasse', 'S');
          data.set('hdnInfraPaginaAtual', pagina.toString());
          data.set('selRpvPrecatorio', 'null');
          return new Promise((resolve, reject) => {
            const xml = new XMLHttpRequest();
            xml.open(method, url);
            xml.responseType = 'document';
            xml.onerror = reject;
            xml.onload = resolve;
            xml.send(data);
          });
        })
        .then(({ target: { response: doc } }) => {
          const tabela = doc.getElementById('tabelaLocalizadores');
          const quantidadeProcessosCarregados = parseInt(
            doc.getElementById('hdnInfraNroItens').value
          );
          if (tabela) {
            console.log(pagina, self.sigla, tabela.querySelector('caption').textContent);
            const linhasList = tabela.querySelectorAll('tr[data-classe]');
            const linhas = Array.from(linhasList);
            const processosComPrazoAberto = new Set();
            linhas.forEach(linha => {
              const link = linha.cells[1].querySelector('a[href]');
              const numproc = new URL(link.href).searchParams.get('num_processo');
              processosComPrazoAberto.add(numproc);
            });
            self.processos = self.processos.filter(
              processo => !processosComPrazoAberto.has(processo.numproc)
            );
          } else {
            console.log(pagina, self.sigla, quantidadeProcessosCarregados);
          }
          if (doc.getElementById('lnkProximaPaginaSuperior')) {
            const paginaAtual = parseInt(doc.getElementById('selInfraPaginacaoSuperior').value);
            const paginaNova = paginaAtual < 2 ? 2 : paginaAtual + 1;
            return self.obterPrazosPagina.call(self, paginaNova);
          }
          const gui = GUI.getInstance();
          gui.avisoCarregando.acrescentar(parseInt(self.link.textContent));
          return self;
        });
    },
    excluirPrazosAbertos() {
      const link = this.link;
      if (!link.href) {
        return Promise.resolve(this);
      }
      return this.obterPrazosPagina(0).then(() => {
        this.link.textContent = this.processos.length;
        return this;
      });
    },
    obterProcessos() {
      this.processos = [];
      const link = this.link;
      if (!link.href) {
        return Promise.resolve(this);
      }
      return this.obterPagina(0).then(() => {
        this.quantidadeProcessosNaoFiltrados = this.processos.length;
        this.link.textContent = this.processos.length;
        if (this.processos.length > 0) {
          const localizadorProcesso = this.processos[0].localizadores.filter(
            localizador => localizador.id === this.id
          )[0];
          if (!this.sigla) {
            this.sigla = localizadorProcesso.sigla;
          }
          if (this.sigla && this.nome) {
            this.siglaNome = [this.sigla, this.nome].join(' - ');
          }
          const siglaComSeparador = `${this.sigla} - `;
          this.nome = this.siglaNome.substr(siglaComSeparador.length);
          this.lembrete = localizadorProcesso.lembrete;
        }
        return this;
      });
    },
    get quantidadeProcessos() {
      return Number(this.link.textContent);
    }
  };
  const LocalizadorFactory = {
    fromLinha(linha) {
      const localizador = new Localizador();
      localizador.linha = linha;
      const separador = ' - ';
      const siglaNome = linha.cells[0].textContent.split(separador);
      siglaNome.forEach((_, i) => {
        const qtdPartesSigla = i + 1;
        const sigla = siglaNome.slice(0, qtdPartesSigla).join(separador);
        const nome = siglaNome.slice(qtdPartesSigla).join(separador);
        if (isContained(sigla, nome)) {
          localizador.sigla = sigla;
          localizador.nome = nome;
        }
      });
      localizador.siglaNome = siglaNome.join(separador);
      const link = (localizador.link = linha.querySelector('a'));
      localizador.quantidadeProcessosNaoFiltrados = parseInt(link.textContent);
      if (link.href) {
        const camposGet = new URL(link.href).searchParams;
        localizador.id = camposGet.get('selLocalizador');
      }
      return localizador;
    },
    fromLinhaPainel(linha) {
      const localizador = new Localizador();
      localizador.linha = linha;
      localizador.nome = linha.cells[0].textContent.match(
        /^Processos com Localizador\s+"(.*)"$/
      )[1];
      const link = (localizador.link = linha.querySelector('a,u'));
      localizador.quantidadeProcessosNaoFiltrados = parseInt(link.textContent);
      if (link && link.href) {
        const camposGet = new URL(link.href).searchParams;
        localizador.id = camposGet.get('selLocalizador');
      }
      return localizador;
    }
  };
  function paraCadaLocalizador(fn) {
    const cookiesAntigos = parseCookies(document.cookie);
    const promises = this.map(fn);
    return Promise.all(promises).then(() => {
      const cookiesNovos = parseCookies(document.cookie);
      const expira = [new Date()]
        .map(d => {
          d.setFullYear(d.getFullYear() + 1);
          return d;
        })
        .map(d => d.toUTCString())
        .reduce((_, x) => x);
      for (const key in cookiesNovos) {
        const valorAntigo = cookiesAntigos[key];
        const valorNovo = cookiesNovos[key];
        if (typeof valorAntigo !== 'undefined' && valorNovo !== valorAntigo) {
          document.cookie = `${escape(key)}=${escape(valorAntigo)}; expires=${expira}`;
        }
      }
    });
  }
  function Localizadores() {}
  Localizadores.prototype = definirPropriedades(Object.create(Array.prototype), {
    constructor: Localizadores,
    tabela: null,
    obterProcessos() {
      return paraCadaLocalizador.call(this, localizador => localizador.obterProcessos());
    },
    get quantidadeProcessos() {
      return this.reduce((soma, localizador) => soma + localizador.quantidadeProcessos, 0);
    },
    get quantidadeProcessosNaoFiltrados() {
      return this.reduce(
        (soma, localizador) => soma + localizador.quantidadeProcessosNaoFiltrados,
        0
      );
    }
  });
  const LocalizadoresFactory = {
    fromTabela(tabela) {
      const localizadores = new Localizadores();
      localizadores.tabela = tabela;
      const linhas = [...tabela.querySelectorAll('tr[class^="infraTr"]')];
      linhas.forEach(linha => {
        localizadores.push(LocalizadorFactory.fromLinha(linha));
      });
      return localizadores;
    },
    fromTabelaPainel(tabela) {
      const localizadores = new Localizadores();
      localizadores.tabela = tabela;
      const linhas = [...tabela.querySelectorAll('tr[class^="infraTr"]')];
      linhas.forEach(linha => {
        localizadores.push(LocalizadorFactory.fromLinhaPainel(linha));
      });
      return localizadores;
    }
  };
  return LocalizadoresFactory;
})();
var ProcessoFactory = (function() {
  function LocalizadorProcesso() {}
  LocalizadorProcesso.prototype = {
    constructor: LocalizadorProcesso,
    id: null,
    lembrete: null,
    principal: null,
    sigla: null
  };
  const LocalizadorProcessoFactory = {
    fromInput(input) {
      const localizador = new LocalizadorProcesso();
      localizador.id = input.value;
      const elementoNome = input.nextSibling;
      localizador.principal = elementoNome.nodeName.toLowerCase() === 'u';
      localizador.sigla = elementoNome.textContent.trim();
      const linkLembrete = elementoNome.nextElementSibling;
      if (linkLembrete.attributes.hasOwnProperty('onmouseover')) {
        const onmouseover = linkLembrete.attributes.onmouseover.value;
        localizador.lembrete = onmouseover.match(
          /^return infraTooltipMostrar\('Obs: (.*) \/ ([^(]+)\(([^)]+)\)','',400\);$/
        )[1];
      }
      return localizador;
    }
  };
  function LocalizadoresProcesso() {}
  LocalizadoresProcesso.prototype = definirPropriedades(Object.create(Array.prototype), {
    constructor: LocalizadoresProcesso,
    principal: null
  });
  const LocalizadoresProcessoFactory = {
    fromCelula(celula) {
      const localizadores = new LocalizadoresProcesso();
      const inputs = [...celula.getElementsByTagName('input')];
      inputs.forEach(input => {
        const localizador = LocalizadorProcessoFactory.fromInput(input);
        if (localizador.principal) {
          localizadores.principal = localizador;
        }
        localizadores.push(localizador);
      });
      return localizadores;
    }
  };
  const MILISSEGUNDOS_EM_UM_DIA = 864e5;
  const COMPETENCIA_JUIZADO_MIN = 9,
    COMPETENCIA_JUIZADO_MAX = 20,
    COMPETENCIA_CRIMINAL_MIN = 21,
    COMPETENCIA_CRIMINAL_MAX = 30,
    COMPETENCIA_EF_MIN = 41,
    COMPETENCIA_EF_MAX = 43,
    CLASSE_EF = 99,
    CLASSE_CARTA_PRECATORIA = 60;
  function Processo() {
    this.classe = null;
    this.dadosComplementares = new Set();
    this.dataAutuacao = null;
    this.dataInclusaoLocalizador = null;
    this.dataSituacao = null;
    this.dataUltimoEvento = null;
    this.juizo = null;
    this.lembretes = [];
    this.linha = null;
    this.link = null;
    this.localizadores = [];
    this.numClasse = null;
    this.numCompetencia = null;
    this.numproc = null;
    this.numprocFormatado = null;
    this.sigilo = null;
    this.situacao = null;
    this.ultimoEvento = null;
  }

  const memoize = fn => {
    const store = new Map();
    return x => {
      if (!store.has(x)) {
        store.set(x, fn(x));
      }
      return store.get(x);
    };
  };

  const DOMINGO = 0;
  const SEGUNDA = 1;
  const SABADO = 6;

  const adiantarParaSabado = data => {
    const diaDaSemana = data.getDay();
    if (diaDaSemana === DOMINGO) {
      return new Date(data.getFullYear(), data.getMonth(), data.getDate() - 1);
    }
    if (diaDaSemana === SEGUNDA) {
      return new Date(data.getFullYear(), data.getMonth(), data.getDate() - 2);
    }
    return new Date(data.getTime());
  };

  const prorrogarParaSegunda = data => {
    const diaDaSemana = data.getDay();
    if (diaDaSemana === DOMINGO) {
      return new Date(data.getFullYear(), data.getMonth(), data.getDate() + 1);
    }
    if (diaDaSemana === SABADO) {
      return new Date(data.getFullYear(), data.getMonth(), data.getDate() + 2);
    }
    return new Date(data.getTime());
  };

  const JANEIRO = 0;
  const DEZEMBRO = 11;
  const calcularRecesso = memoize(ano => {
    const inicio = adiantarParaSabado(new Date(ano, DEZEMBRO, 20));
    const retorno = prorrogarParaSegunda(new Date(ano + 1, JANEIRO, 7));
    return { inicio, retorno };
  });

  const calcularRecessoData = data => {
    let { inicio, retorno } = calcularRecesso(data.getFullYear() - 1);
    while (data > retorno) {
      const recesso = calcularRecesso(retorno.getFullYear());
      inicio = recesso.inicio;
      retorno = recesso.retorno;
    }
    return { inicio, retorno };
  };

  const calcularAtraso = (a, b) => {
    const { inicio, retorno } = calcularRecessoData(a);
    return Math.max(0, inicio - a) - Math.max(0, inicio - b) + Math.max(0, b - retorno);
  };

  Processo.prototype = {
    constructor: Processo,
    get atraso() {
      const hoje = new Date();
      return calcularAtraso(this.termoPrazoCorregedoria, hoje) / MILISSEGUNDOS_EM_UM_DIA;
    },
    get atrasoPorcentagem() {
      return this.atraso / this.prazoCorregedoria;
    },
    get competenciaCorregedoria() {
      if (
        this.numCompetencia >= COMPETENCIA_JUIZADO_MIN &&
        this.numCompetencia <= COMPETENCIA_JUIZADO_MAX
      ) {
        return CompetenciasCorregedoria.JUIZADO;
      } else if (
        this.numCompetencia >= COMPETENCIA_CRIMINAL_MIN &&
        this.numCompetencia <= COMPETENCIA_CRIMINAL_MAX
      ) {
        return CompetenciasCorregedoria.CRIMINAL;
      } else if (
        (this.numCompetencia >= COMPETENCIA_EF_MIN || this.numCompetencia <= COMPETENCIA_EF_MAX) &&
        (this.numClasse === CLASSE_EF || this.numClasse === CLASSE_CARTA_PRECATORIA)
      ) {
        return CompetenciasCorregedoria.EXECUCAO_FISCAL;
      }
      return CompetenciasCorregedoria.CIVEL;
    },
    get campoDataConsiderada() {
      let ret = 'dataSituacao';
      switch (this.situacao) {
        case 'MOVIMENTO-AGUARDA DESPACHO':
        case 'MOVIMENTO-AGUARDA SENTENÇA':
          ret = 'dataSituacao';
          break;
        case 'MOVIMENTO':
          ret = 'dataUltimoEvento';
          if (this.dataInclusaoLocalizador < this.dataUltimoEvento) {
            if (document.body.matches('.gmConsiderarDataInclusaoLocalizador')) {
              ret = 'dataInclusaoLocalizador';
            }
          }
          break;
        default:
          ret = 'dataSituacao';
          break;
      }
      return ret;
    },
    get prazoCorregedoria() {
      const situacao = Situacoes[this.situacao] || Situacoes['INDEFINIDA'];
      let dias = RegrasCorregedoria[this.competenciaCorregedoria][situacao];
      if (this.prioridade && document.body.matches('.gmPrazoMetade')) dias /= 2;
      return dias;
    },
    get prioridade() {
      return (
        this.dadosComplementares.has('Prioridade Atendimento') ||
        this.dadosComplementares.has('Réu Preso')
      );
    },
    get termoPrazoCorregedoria() {
      const dataConsiderada = new Date(this[this.campoDataConsiderada].getTime());
      let recesso = calcularRecessoData(dataConsiderada);
      if (dataConsiderada >= recesso.inicio) {
        dataConsiderada.setTime(recesso.retorno.getTime());
      }
      const dataTermo = new Date(dataConsiderada.getTime());
      dataTermo.setDate(dataTermo.getDate() + this.prazoCorregedoria);
      while (dataTermo >= recesso.inicio) {
        dataTermo.setTime(dataTermo.getTime() + (recesso.retorno - recesso.inicio));
        recesso = calcularRecesso(recesso.retorno.getFullYear());
      }
      return dataTermo;
    }
  };
  const ProcessoFactory = {
    fromLinha(linha) {
      const processo = new Processo();
      processo.linha = linha;
      processo.numClasse = Number(linha.dataset.classe);
      processo.numCompetencia = Number(linha.dataset.competencia);
      const link = (processo.link = linha.cells[1].querySelector('a'));
      const numprocFormatado = (processo.numprocFormatado = link.textContent);
      processo.numproc = numprocFormatado.replace(/[-.]/g, '');
      const links = linha.cells[1].getElementsByTagName('a');
      if (links.length === 2) {
        const onmouseover = [...links[1].attributes].filter(attr => attr.name === 'onmouseover')[0]
          .value;
        const [, codigoLembrete] = onmouseover.match(
          /^return infraTooltipMostrar\('([^']+)','Lembretes',400\);$/
        );
        const div = document.createElement('div');
        div.innerHTML = codigoLembrete;
        const tabela = div.childNodes[0];
        const linhas = Array.from(tabela.rows).reverse();
        processo.lembretes = linhas.map(linha => {
          const celula = linha.cells[2];
          celula.innerHTML = celula.innerHTML.replace(/<br.*?>/g, '\0\n');
          return celula.textContent;
        });
      }
      const textoSigilo = linha.cells[1].getElementsByTagName('br')[0].nextSibling.textContent;
      processo.sigilo = Number(textoSigilo.match(/Nível ([0-5])/)[1]);
      processo.situacao = linha.cells[2].textContent;
      processo.juizo = linha.cells[3].textContent;
      processo.dataAutuacao = parseDataHora(linha.cells[4].textContent);
      const diasNaSituacao = Number(linha.cells[5].textContent);
      const dataSituacao = new Date();
      dataSituacao.setDate(dataSituacao.getDate() - diasNaSituacao);
      processo.dataSituacao = dataSituacao;
      const labelsDadosComplementares = [...linha.cells[6].getElementsByTagName('label')];
      if (labelsDadosComplementares.length === 0) {
        processo.classe = linha.cells[6].textContent;
      } else {
        processo.classe = linha.cells[6].firstChild.textContent;
        labelsDadosComplementares.forEach(label =>
          processo.dadosComplementares.add(label.textContent)
        );
      }
      processo.localizadores = LocalizadoresProcessoFactory.fromCelula(linha.cells[7]);
      const breakUltimoEvento = linha.cells[8].querySelector('br');
      processo.dataUltimoEvento = parseDataHora(breakUltimoEvento.previousSibling.textContent);
      processo.ultimoEvento = breakUltimoEvento.nextSibling.textContent;
      processo.dataInclusaoLocalizador = parseDataHora(linha.cells[9].textContent);
      const textoPrioridade = linha.cells[10].textContent;
      if (textoPrioridade === 'Sim') {
        processo.dadosComplementares.add('Prioridade Atendimento');
      }
      return processo;
    }
  };
  return ProcessoFactory;
})();
var RegrasCorregedoria = {
  [CompetenciasCorregedoria.JUIZADO]: {
    [Situacoes['INICIAL']]: 10,
    [Situacoes['MOVIMENTO-AGUARDA DESPACHO']]: 15,
    [Situacoes['MOVIMENTO']]: 10,
    [Situacoes['MOVIMENTO-AGUARDA SENTENÇA']]: 45,
    [Situacoes['INDEFINIDA']]: 30
  },
  [CompetenciasCorregedoria.CIVEL]: {
    [Situacoes['INICIAL']]: 10,
    [Situacoes['MOVIMENTO-AGUARDA DESPACHO']]: 20,
    [Situacoes['MOVIMENTO']]: 15,
    [Situacoes['MOVIMENTO-AGUARDA SENTENÇA']]: 60,
    [Situacoes['INDEFINIDA']]: 60
  },
  [CompetenciasCorregedoria.CRIMINAL]: {
    [Situacoes['INICIAL']]: 15,
    [Situacoes['MOVIMENTO-AGUARDA DESPACHO']]: 20,
    [Situacoes['MOVIMENTO']]: 15,
    [Situacoes['MOVIMENTO-AGUARDA SENTENÇA']]: 60,
    [Situacoes['INDEFINIDA']]: 30
  },
  [CompetenciasCorregedoria.EXECUCAO_FISCAL]: {
    [Situacoes['INICIAL']]: 10,
    [Situacoes['MOVIMENTO-AGUARDA DESPACHO']]: 60,
    [Situacoes['MOVIMENTO']]: 25,
    [Situacoes['MOVIMENTO-AGUARDA SENTENÇA']]: 60,
    [Situacoes['INDEFINIDA']]: 120
  }
};
function adicionarBotaoComVinculo(localizadores) {
  const gui = GUI.getInstance();
  const botao = gui.criarBotaoAcao(localizadores);
  botao.addEventListener(
    'click',
    () => {
      gui.avisoCarregando.atualizar(0, localizadores.quantidadeProcessosNaoFiltrados);
      localizadores.obterProcessos().then(() => {
        gui.avisoCarregando.ocultar();
        gui.atualizarBotaoAcao();
        localizadores.forEach(localizador => {
          gui.atualizarVisualizacao(localizador);
        });
        gui.criarGrafico(localizadores);
        gui.atualizarGrafico = gui.criarGrafico.bind(null, localizadores);
      });
    },
    false
  );
}
if (/\?acao=usuario_tipo_monitoramento_localizador_listar&/.test(location.search)) {
  const tabela = document.getElementById('divInfraAreaTabela').querySelector('table');
  const localizadores = LocalizadoresFactory.fromTabela(tabela);
  adicionarBotaoComVinculo(localizadores);
} else if (/\?acao=localizador_processos_lista&/.test(location.search)) {
  /* do nothing */
} else if (/&acao_origem=principal&/.test(location.search)) {
  const tabela = document.getElementById('fldLocalizadores').querySelector('table');
  const localizadores = LocalizadoresFactory.fromTabelaPainel(tabela);
  adicionarBotaoComVinculo(localizadores);
}
function definirPropriedades(target, ...sources) {
  sources.forEach(source => {
    Object.defineProperties(
      target,
      Object.getOwnPropertyNames(source).reduce((descriptors, key) => {
        descriptors[key] = Object.getOwnPropertyDescriptor(source, key);
        return descriptors;
      }, {})
    );
  });
  return target;
}
function isContained(origContained, origContainer) {
  const contained = origContained.toLowerCase();
  const container = origContainer.toLowerCase();
  const ignored = /[./]/;
  let indexFrom = -1;
  return Array.prototype.every.call(
    contained,
    char => ignored.test(char) || !!(indexFrom = container.indexOf(char, indexFrom) + 1)
  );
}
function parseCookies(texto) {
  const pares = texto.split(/\s*;\s*/);
  return parsePares(pares);
}
function parseDataHora(texto) {
  const [d, m, y, h, i, s] = texto.split(/\W/g);
  return new Date(y, m - 1, d, h, i, s);
}
function parsePares(pares) {
  return pares.reduce((obj, par) => {
    let nome, valores, valor;
    [nome, ...valores] = par.split('=');
    nome = unescape(nome);
    valor = unescape(valores.join('='));
    obj[nome] = valor;
    return obj;
  }, {});
}
