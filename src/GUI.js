// eslint-disable-next-line no-unused-vars
import estilos from './includes/estilos.scss';

import criarGrafico from './criarGrafico';
import { isContained } from './helpers';
import avisoCarregando from './avisoCarregando';

var instance = null,
	construindo = false,
	button = null;

var invalidSymbols = /[&<>"]/g;
var replacementSymbols = { '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot' };
function safeHTML(strings, ...vars) {
	return vars.reduce(
		(result, variable, i) =>
			result +
			variable.replace(invalidSymbols, sym => `&${replacementSymbols[sym]};`) +
			strings[i + 1],
		strings[0]
	);
}

export default class GUI {
	constructor() {
		if (! construindo) {
			throw new Error(
				'Classe deve ser instanciada usando o método .getInstance().'
			);
		}
	}

	atualizarBotaoAcao() {
		if (button) {
			button.textContent = 'Atualizar';
		}
	}

	atualizarVisualizacao(localizador, filtrado = false) {
		var linha = localizador.linha;
		const DIAS_A_FRENTE = 3;
		var avisos = [
			'Processos com prazo excedido em dobro',
			'Processos com prazo vencido',
			`Processos com prazo a vencer nos próximos ${DIAS_A_FRENTE} dias`,
			'Processos no prazo',
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
		const atrasoAVencer =
			(agora.getTime() - aVencer.getTime()) / MILISSEGUNDOS_EM_UM_DIA;
		var prioridades = [
			localizador.processos.filter(processo => processo.atrasoPorcentagem >= 1),
			localizador.processos.filter(
				processo => processo.atraso >= 0 && processo.atrasoPorcentagem < 1
			),
			localizador.processos.filter(
				processo => processo.atraso < 0 && processo.atraso >= atrasoAVencer
			),
			localizador.processos.filter(processo => processo.atraso < atrasoAVencer),
		];
		var baloes = prioridades.map(function(processos, indicePrioridade) {
			return `<span id="gmLocalizador${
				localizador.id
			}Prioridade${indicePrioridade}" class="gmProcessos gmPrioridade${indicePrioridade}${processos.length > 0 ? '' : ' gmVazio'}" onmouseover="infraTooltipMostrar(&quot;${avisos[indicePrioridade]}&quot;);" onmouseout="infraTooltipOcultar();">${processos.length}</span>`;
		});
		var conteudo = [];
		if (! (localizador.sigla || localizador.nome)) {
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
				`<img class="infraImgNormal" src="../../../infra_css/imagens/balao.gif" style="width:0.9em; height:0.9em; opacity:1; border-width:0;" onmouseover="${safeHTML`return infraTooltipMostrar('${
					localizador.lembrete
				}','',400);`}" onmouseout="return infraTooltipOcultar();"/>`
			);
		}
		var processosComPeticao = localizador.processos.filter(processo => {
			let localizadoresPeticao = processo.localizadores.filter(
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
				processosComPeticao.length > OCULTAR_BALOES_COM_MAIS_DE
					? '+'
					: processosComPeticao.length
			}</span>`
		);
		conteudo.push('<div class="gmBaloes">');
		conteudo.push(baloes.join(''));
		conteudo.push('</div>');
		linha.cells[0].innerHTML = conteudo.join('');
		if (localizador.quantidadeProcessosNaoFiltrados > 0) {
			var container = document.createElement('span');
			container.className = 'gmBotoesLocalizador';
			if (filtrado) {
				linha.classList.add('gmFiltrado');
			} else {
				linha.classList.remove('gmFiltrado');
				var filtrar = document.createElement('a');
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
					function(evt) {
						evt.preventDefault();
						evt.stopPropagation();
						Array.from(
							document.getElementsByClassName('gmDetalhesAberto')
						).forEach(function(balaoAberto) {
							let linhaAberta = balaoAberto.parentElement;
							while (linhaAberta && linhaAberta.tagName.toLowerCase() !== 'tr')
								linhaAberta = linhaAberta.parentElement;
							if (linhaAberta && linhaAberta === linha) {
								balaoAberto.classList.remove('gmDetalhesAberto');
								Array.from(
									document.getElementsByClassName('gmDetalhes')
								).forEach(function(linhaAntiga) {
									linha.parentElement.removeChild(linhaAntiga);
								});
							}
						});
						var gui = GUI.getInstance();
						gui.avisoCarregando.exibir(
							'Filtrando processos com prazo em aberto...'
						);
						gui.avisoCarregando.atualizar(0, localizador.quantidadeProcessos);
						localizador.excluirPrazosAbertos().then(function() {
							gui.avisoCarregando.ocultar();
							gui.atualizarVisualizacao(localizador, true);
							gui.atualizarGrafico();
						});
					},
					false
				);
				container.appendChild(filtrar);
			}
			var atualizar = document.createElement('a');
			atualizar.className = 'gmAtualizar';
			atualizar.textContent = 'Atualizar';
			atualizar.addEventListener(
				'click',
				function(evt) {
					evt.preventDefault();
					evt.stopPropagation();
					Array.from(
						document.getElementsByClassName('gmDetalhesAberto')
					).forEach(function(balaoAberto) {
						let linhaAberta = balaoAberto.parentElement;
						while (linhaAberta && linhaAberta.tagName.toLowerCase() !== 'tr')
							linhaAberta = linhaAberta.parentElement;
						if (linhaAberta && linhaAberta === linha) {
							balaoAberto.classList.remove('gmDetalhesAberto');
							Array.from(document.getElementsByClassName('gmDetalhes')).forEach(
								function(linhaAntiga) {
									linha.parentElement.removeChild(linhaAntiga);
								}
							);
						}
					});
					var gui = GUI.getInstance();
					gui.avisoCarregando.exibir('Atualizando...');
					gui.avisoCarregando.atualizar(
						0,
						localizador.quantidadeProcessosNaoFiltrados
					);
					localizador.obterProcessos().then(function() {
						gui.avisoCarregando.ocultar();
						gui.atualizarVisualizacao(localizador);
						gui.atualizarGrafico();
					});
				},
				false
			);
			container.appendChild(atualizar);
			var divExistente = linha.cells[0].querySelector('div');
			divExistente.insertBefore(container, divExistente.firstChild);
		}
		function alternarDetalhes(balao, processos, indicePrioridade) {
			Array.from(document.getElementsByClassName('gmDetalhes')).forEach(
				function(linhaAntiga) {
					linha.parentElement.removeChild(linhaAntiga);
				}
			);
			if (balao.classList.contains('gmDetalhesAberto')) {
				balao.classList.remove('gmDetalhesAberto');
				return;
			}
			Array.from(document.getElementsByClassName('gmDetalhesAberto')).forEach(
				function(balaoAberto) {
					balaoAberto.classList.remove('gmDetalhesAberto');
				}
			);
			balao.classList.add('gmDetalhesAberto');
			const MENOR = -1,
				MAIOR = +1;
			processos.sort((a, b) => {
				if (a.termoPrazoCorregedoria < b.termoPrazoCorregedoria) return MENOR;
				if (a.termoPrazoCorregedoria > b.termoPrazoCorregedoria) return MAIOR;
				return 0;
			});
			processos.forEach(function(processo, indiceProcesso) {
				var linhaNova = linha.parentElement.insertRow(
					linha.rowIndex + 1 + indiceProcesso
				);
				var atraso = Math.round(processo.atraso);
				linhaNova.className = 'infraTrClara gmDetalhes';
				const DIGITOS_CLASSE = 6,
					DIGITOS_COMPETENCIA = 2;
				linhaNova.dataset.classe = (
					'0'.repeat(DIGITOS_CLASSE) + processo.numClasse
				).substr(-DIGITOS_CLASSE);
				linhaNova.dataset.competencia = (
					'0'.repeat(DIGITOS_COMPETENCIA) + processo.numCompetencia
				).substr(-DIGITOS_COMPETENCIA);
				var textoData;
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
				var indicePrioridadeProcesso = indicePrioridade;
				if (typeof indicePrioridade === 'undefined') {
					prioridades.forEach((processos, indice) => {
						if (processos.includes(processo)) {
							indicePrioridadeProcesso = indice;
						}
					});
				}
				var esperado = processo.prazoCorregedoria;
				var minimo = 0;
				var maximo =
					esperado *
					(indicePrioridadeProcesso > 1
						? MAXIMO_PRIORIDADE_DOIS_OU_MAIOR
						: MAXIMO_PRIORIDADE_MENOR_OU_IGUAL_A_UM);
				var baixo = esperado - DIAS_BAIXO;
				var alto = esperado;
				var ideal = esperado * IDEAL;
				var valor = esperado + atraso;
				const PCT = 100;
				var porcentagem = `${Math.round(
					PCT + processo.atrasoPorcentagem * PCT
				)}%`;
				var localizadoresExtra = processo.localizadores
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
						`<abbr title="${textoData}">${processo[
							processo.campoDataConsiderada
						]
							.toLocaleString()
							.substr(0, 10)}</abbr> + ${esperado
							.toString()
							.replace(/\.5$/, '&half;')}${
							esperado >= 2 ? ' dias' : ' dia'
						} = ${processo.termoPrazoCorregedoria
							.toLocaleString()
							.substr(0, 10)}`,
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
						? processo.atraso >= 0 ? 'menos de um' : 'Menos de um'
						: Math.abs(atraso),
					Math.abs(atraso) > 1 ? ' dias ' : ' dia ',
					processo.atraso < 0 ? 'até o fim do prazo' : '',
					processo.prioridade
						? '</span> <span class="gmPrioridade">(Prioridade)</span>'
						: '',
					'</td>',
				].join('');
			});
		}
		prioridades.forEach(function(processos, indicePrioridade) {
			var balao = document.getElementById(
				`gmLocalizador${localizador.id}Prioridade${indicePrioridade}`
			);
			balao.addEventListener(
				'click',
				function(evt) {
					evt.preventDefault();
					evt.stopPropagation();
					alternarDetalhes(balao, processos, indicePrioridade);
				},
				false
			);
		});
		const balaoPeticoes = document.getElementById(
			`gmLocalizador${localizador.id}Peticoes`
		);
		balaoPeticoes.addEventListener(
			'click',
			function(evt) {
				evt.preventDefault();
				evt.stopPropagation();
				alternarDetalhes(balaoPeticoes, processosComPeticao);
			},
			false
		);
	}

	get avisoCarregando() {
		return avisoCarregando;
	}

	criarBotaoAcao(localizadores) {
		var frag = document.createDocumentFragment();
		var area = document.getElementById('divInfraAreaTelaD');
		button = document.createElement('button');
		button.textContent = 'Analisar conteúdo dos localizadores';
		frag.appendChild(button);
		frag.appendChild(document.createElement('br'));
		function criarCheckboxMostrar(
			id,
			padrao,
			[classeTrue, classeFalse],
			texto
		) {
			var input = document.createElement('input');
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
			input.checked = localStorage.hasOwnProperty(id)
				? localStorage.getItem(id) === 'S'
				: padrao;
			input.addEventListener('click', onChange);
			var gui = GUI.getInstance();
			input.addEventListener('click', () => {
				Array.from(document.querySelectorAll('.gmDetalhes')).forEach(detalhe =>
					detalhe.parentNode.removeChild(detalhe)
				);
				localizadores.forEach(localizador =>
					gui.atualizarVisualizacao(localizador)
				);
				if (typeof gui.atualizarGrafico === 'function') gui.atualizarGrafico();
			});
			onChange();
			var label = document.createElement('label');
			label.textContent = texto;
			label.insertBefore(input, label.firstChild);
			return label;
		}
		var labelClasses = criarCheckboxMostrar(
			'mostrarClasses',
			true,
			['', 'gmNaoMostrarClasses'],
			' Mostrar classe dos processos'
		);
		frag.appendChild(labelClasses);
		frag.appendChild(document.createElement('br'));
		var labelDias = criarCheckboxMostrar(
			'mostrarDiasParaFim',
			true,
			['', 'gmNaoMostrarDiasParaFim'],
			' Mostrar dias para o fim do prazo'
		);
		frag.appendChild(labelDias);
		frag.appendChild(document.createElement('br'));
		var labelConsiderarDataInclusaoLocalizador = criarCheckboxMostrar(
			'considerarDataInclusaoLocalizador',
			false,
			['gmConsiderarDataInclusaoLocalizador', ''],
			'Entre data do último evento e da inclusão no localizador, considerar a mais antiga'
		);
		frag.appendChild(labelConsiderarDataInclusaoLocalizador);
		frag.appendChild(document.createElement('br'));
		var labelPrazoMetade = criarCheckboxMostrar(
			'prazoMetade',
			true,
			['gmPrazoMetade', ''],
			'Conceder metade do prazo normal para processos prioritários'
		);
		frag.appendChild(labelPrazoMetade);
		frag.appendChild(document.createElement('br'));
		area.insertBefore(frag, area.firstChild);
		return button;
	}

	get criarGrafico() {
		return criarGrafico;
	}

	static getInstance() {
		if (! instance) {
			construindo = true;
			instance = new GUI();
			construindo = false;
		}
		return instance;
	}

	visitLocalizador(pvtVars) {
		return pvtVars;
	}
}
