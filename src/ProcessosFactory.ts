import { Either } from '../adt/Either';
import { Iter } from '../adt/Iter';
import { Maybe } from '../adt/Maybe';
import { liftA4 } from '../adt/liftA';
import { queryAll } from './Query/queryAll';
import { CompetenciasCorregedoria } from './CompetenciasCorregedoria';
import { Situacoes } from './Situacoes';
import { RegrasCorregedoria } from './RegrasCorregedoria';
import { queryOne } from './Query/queryOne';

const { Left, Right } = Either;
const { Just, Nothing } = Maybe;

export interface LocalizadorProcesso {
	id: string;
	lembrete?: string;
	principal: boolean;
	sigla: string;
}

export class LocalizadorProcessoFactory {
	static fromInput(
		input: HTMLInputElement
	): Either<Error, LocalizadorProcesso> {
		const id = Either.of<Error, string>(input.value);

		const elementoNome = Either.fromNullable(input.nextSibling).orElse(() =>
			Left(new Error('Não foi possível obter a sigla do localizador.'))
		);

		const principal = elementoNome.map(n => n.nodeName.toLowerCase() === 'u');

		const sigla = elementoNome.chain(n =>
			Maybe.fromNullable(n.textContent)
				.map(t => t.trim())
				.filter(Boolean)
				.maybe<Either<Error, string>>(
					() =>
						Left(new Error('Não foi possível obter a sigla do localizador.')),
					Right
				)
		);

		const lembrete = elementoNome
			.chain<Element>(node => {
				let elt = node.nextSibling;
				while (elt !== null) {
					if (elt.nodeType === Node.ELEMENT_NODE) return Right(elt as Element);
					elt = elt.nextSibling;
				}
				return Left(new Error('Ícone do lembrete não encontrado.'));
			})
			.map(elt =>
				Maybe.of(elt)
					.mapNullable(l => l.getAttribute('onmouseover'))
					.mapNullable(t =>
						t.match(
							/^return infraTooltipMostrar\('Obs: (.*) \/ ([^(]+)\(([^)]+)\)','',400\);$/
						)
					)
					.map(m => m[1])
			);
		return liftA4(
			(id, principal, sigla, lembrete): LocalizadorProcesso => ({
				id,
				principal,
				sigla,
				lembrete: lembrete.maybe(() => undefined, a => a),
			}),
			id,
			principal,
			sigla,
			lembrete
		);
	}
}

export class LocalizadoresProcesso extends Iter<LocalizadorProcesso> {
	readonly principal: Maybe<LocalizadorProcesso>;
	constructor(iter: Iter<LocalizadorProcesso>) {
		super(iter.reduce.bind(iter));
		this.principal = this.reduce<Maybe<LocalizadorProcesso>>(
			(principal, atual) => (atual.principal ? Just(atual) : principal),
			Nothing()
		);
	}
}

export class LocalizadoresProcessoFactory {
	static fromCelula(
		celula: HTMLTableCellElement
	): Either<Error, LocalizadoresProcesso> {
		return queryAll<HTMLInputElement>('input', celula)
			.traverse(Either, LocalizadorProcessoFactory.fromInput)
			.map(locs => new LocalizadoresProcesso(locs));
	}
}
const MILISSEGUNDOS_EM_UM_DIA = 864e5;
const COMPETENCIA_JUIZADO_MIN = 9,
	COMPETENCIA_JUIZADO_MAX = 20,
	COMPETENCIA_CRIMINAL_MIN = 21,
	COMPETENCIA_CRIMINAL_MAX = 30,
	COMPETENCIA_EF_MIN = 41,
	COMPETENCIA_EF_MAX = 43,
	CLASSE_EF = 99,
	CLASSE_CARTA_PRECATORIA = 60;
const memoize = <A, B>(fn: (_: A) => B): ((_: A) => B) => {
	const store = new Map<A, B>();
	return x => {
		if (!store.has(x)) {
			store.set(x, fn(x));
		}
		return store.get(x) as B;
	};
};

const DOMINGO = 0;
const SEGUNDA = 1;
const SABADO = 6;

const adiantarParaSabado = (data: Date) => {
	const diaDaSemana = data.getDay();
	if (diaDaSemana === DOMINGO) {
		return new Date(data.getFullYear(), data.getMonth(), data.getDate() - 1);
	}
	if (diaDaSemana === SEGUNDA) {
		return new Date(data.getFullYear(), data.getMonth(), data.getDate() - 2);
	}
	return new Date(data.getTime());
};

const prorrogarParaSegunda = (data: Date) => {
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
const calcularRecesso = memoize((ano: number) => {
	const inicio = adiantarParaSabado(new Date(ano, DEZEMBRO, 20));
	const retorno = prorrogarParaSegunda(new Date(ano + 1, JANEIRO, 7));
	return { inicio, retorno };
});

const calcularRecessoData = (data: Date) => {
	let { inicio, retorno } = calcularRecesso(data.getFullYear() - 1);
	while (data > retorno) {
		const recesso = calcularRecesso(retorno.getFullYear());
		inicio = recesso.inicio;
		retorno = recesso.retorno;
	}
	return { inicio, retorno };
};

const calcularAtraso = (dtA: Date, dtB: Date) => {
	const a = dtA.getTime();
	const b = dtB.getTime();
	const { inicio: dtInicio, retorno: dtRetorno } = calcularRecessoData(a);
	const inicio = dtInicio.getTime();
	const retorno = dtRetorno.getTime();
	return (
		Math.max(0, inicio - a) - Math.max(0, inicio - b) + Math.max(0, b - retorno)
	);
};

class Processo {
	constructor(
		private readonly classe: never,
		private readonly dadosComplementares: Set<string>,
		private readonly dataAutuacao: never,
		private readonly dataInclusaoLocalizador: Date,
		private readonly dataSituacao: Date,
		private readonly dataUltimoEvento: Date,
		private readonly juizo: never,
		private readonly lembretes: never[],
		private readonly linha: never,
		private readonly link: never,
		private readonly localizadores: never[],
		private readonly numClasse: never,
		private readonly numCompetencia: never,
		private readonly numproc: never,
		private readonly numprocFormatado: never,
		private readonly sigilo: never,
		private readonly situacao: Situacoes,
		private readonly ultimoEvento: never
	) {}

	get atraso(): number {
		var hoje = new Date();
		return (
			calcularAtraso(this.termoPrazoCorregedoria, hoje) /
			MILISSEGUNDOS_EM_UM_DIA
		);
	}
	get atrasoPorcentagem(): number {
		return this.atraso / this.prazoCorregedoria;
	}
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
			(this.numCompetencia >= COMPETENCIA_EF_MIN ||
				this.numCompetencia <= COMPETENCIA_EF_MAX) &&
			(this.numClasse === CLASSE_EF ||
				this.numClasse === CLASSE_CARTA_PRECATORIA)
		) {
			return CompetenciasCorregedoria.EXECUCAO_FISCAL;
		}
		return CompetenciasCorregedoria.CIVEL;
	}
	get campoDataConsiderada() {
		let ret: 'dataSituacao' | 'dataUltimoEvento' | 'dataInclusaoLocalizador' =
			'dataSituacao';
		switch (this.situacao) {
			case Situacoes['MOVIMENTO-AGUARDA DESPACHO']:
			case Situacoes['MOVIMENTO-AGUARDA SENTENÇA']:
				ret = 'dataSituacao';
				break;
			case Situacoes['MOVIMENTO']:
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
	}
	get prazoCorregedoria() {
		var dias = RegrasCorregedoria[this.competenciaCorregedoria][this.situacao];
		if (this.prioridade && document.body.matches('.gmPrazoMetade')) dias /= 2;
		return dias;
	}
	get prioridade() {
		return (
			this.dadosComplementares.has('Prioridade Atendimento') ||
			this.dadosComplementares.has('Réu Preso')
		);
	}
	get termoPrazoCorregedoria() {
		var dataConsiderada = new Date(this[this.campoDataConsiderada].getTime());
		let recesso = calcularRecessoData(dataConsiderada);
		if (dataConsiderada >= recesso.inicio) {
			dataConsiderada.setTime(recesso.retorno.getTime());
		}
		var dataTermo = new Date(dataConsiderada.getTime());
		dataTermo.setDate(dataTermo.getDate() + this.prazoCorregedoria);
		while (dataTermo >= recesso.inicio) {
			dataTermo.setTime(
				dataTermo.getTime() +
					(recesso.retorno.getTime() - recesso.inicio.getTime())
			);
			recesso = calcularRecesso(recesso.retorno.getFullYear());
		}
		return dataTermo;
	}
}

export class ProcessoFactory {
	static fromLinha(linha: HTMLTableRowElement) {
		var processo = new Processo();
		const numClasse = Maybe.fromNullable(linha.dataset.classe).map(Number);
		const numCompetencia = Maybe.fromNullable(linha.dataset.competencia).map(
			Number
		);
		const link = Maybe.fromNullable(linha.cells[1]).chain(celula =>
			queryOne<HTMLAnchorElement>('a', celula).either<Maybe<HTMLAnchorElement>>(
				Nothing,
				Just
			)
		);
		const numprocFormatado = link
			.mapNullable(l => l.textContent)
			.filter(Boolean);
		const numproc = numprocFormatado.map(t => t.replace(/[-.]/g, ''));
		var links = linha.cells[1].getElementsByTagName('a');
		if (links.length === 2) {
			var onmouseover = [...links[1].attributes].filter(
				attr => attr.name === 'onmouseover'
			)[0].value;
			var [, codigoLembrete] = onmouseover.match(
				/^return infraTooltipMostrar\('([^']+)','Lembretes',400\);$/
			);
			var div = document.createElement('div');
			div.innerHTML = codigoLembrete;
			var tabela = div.childNodes[0];
			var linhas = Array.from(tabela.rows).reverse();
			processo.lembretes = linhas.map(linha => {
				let celula = linha.cells[2];
				celula.innerHTML = celula.innerHTML.replace(/<br.*?>/g, '\0\n');
				return celula.textContent;
			});
		}
		var textoSigilo = linha.cells[1].getElementsByTagName('br')[0].nextSibling
			.textContent;
		processo.sigilo = Number(textoSigilo.match(/Nível ([0-5])/)[1]);
		processo.situacao = linha.cells[2].textContent;
		processo.juizo = linha.cells[3].textContent;
		processo.dataAutuacao = parseDataHora(linha.cells[4].textContent);
		var diasNaSituacao = Number(linha.cells[5].textContent);
		var dataSituacao = new Date();
		dataSituacao.setDate(dataSituacao.getDate() - diasNaSituacao);
		processo.dataSituacao = dataSituacao;
		var labelsDadosComplementares = [
			...linha.cells[6].getElementsByTagName('label'),
		];
		if (labelsDadosComplementares.length === 0) {
			processo.classe = linha.cells[6].textContent;
		} else {
			processo.classe = linha.cells[6].firstChild.textContent;
			labelsDadosComplementares.forEach(label =>
				processo.dadosComplementares.add(label.textContent)
			);
		}
		processo.localizadores = LocalizadoresProcessoFactory.fromCelula(
			linha.cells[7]
		);
		var breakUltimoEvento = linha.cells[8].querySelector('br');
		processo.dataUltimoEvento = parseDataHora(
			breakUltimoEvento.previousSibling.textContent
		);
		processo.ultimoEvento = breakUltimoEvento.nextSibling.textContent;
		processo.dataInclusaoLocalizador = parseDataHora(
			linha.cells[9].textContent
		);
		var textoPrioridade = linha.cells[10].textContent;
		if (textoPrioridade === 'Sim') {
			processo.dadosComplementares.add('Prioridade Atendimento');
		}
		return processo;
	}
}
