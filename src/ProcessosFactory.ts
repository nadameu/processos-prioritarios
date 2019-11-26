import { Either, Left, Right } from '../adt/Either';
import { liftA2 } from '../adt/liftA';
import { Just, Maybe, Nothing } from '../adt/Maybe';
import { eitherToMaybe, maybeToEither } from '../adt/nt';
import { CompetenciasCorregedoria } from './CompetenciasCorregedoria';
import { queryAll } from './Query/queryAll';
import { queryOne } from './Query/queryOne';
import { RegrasCorregedoria } from './RegrasCorregedoria';
import { Situacoes } from './Situacoes';
import { getAttribute } from './Util/getAttribute';
import { index } from './Util/index';
import { match } from './Util/match';
import { nextElementSibling } from './Util/nextElementSibling';
import { textContent } from './Util/textContent';
import { Foldable } from '../adt/Foldable';
import { replace } from './Util/replace';

export interface LocalizadorProcesso {
  id: string;
  lembrete?: string;
  principal: boolean;
  sigla: string;
}

export class LocalizadorProcessoFactory {
  static fromInput(input: HTMLInputElement): Either<Error, LocalizadorProcesso> {
    const id = input.value;

    const elementoNome: Maybe<Node> = Maybe.fromNullable(input.nextSibling);

    const principal = elementoNome.map(n => n.nodeName.toLowerCase() === 'u');

    const sigla = elementoNome.chain(textContent);

    const iconeLembrete = elementoNome.chain(nextElementSibling);
    const lembrete = iconeLembrete
      .chain(getAttribute('onmouseover'))
      .chain(match(/^return infraTooltipMostrar\('Obs: (.*) \/ ([^(]+)\(([^)]+)\)','',400\);$/))
      .chain(index(1));

    const result = liftA2(
      (principal, sigla): LocalizadorProcesso => ({
        id,
        principal,
        sigla,
        lembrete: (<Maybe<string | undefined>>lembrete).getOrElse(undefined)
      }),
      principal,
      sigla
    );
    return result.maybe<Either<Error, LocalizadorProcesso>>(
      () => Left(new Error('Não foi possível obter os dados do localizador.')),
      Right
    );
  }
}

export class LocalizadoresProcesso extends Foldable<LocalizadorProcesso> {
  readonly principal: Maybe<LocalizadorProcesso>;
  constructor(localizadores: Foldable<LocalizadorProcesso>) {
    super(localizadores.reduce.bind(localizadores));
    this.principal = this.reduce<Maybe<LocalizadorProcesso>>(
      (principal, atual) => (atual.principal ? Just(atual) : principal),
      Nothing()
    );
  }
}

export class LocalizadoresProcessoFactory {
  static fromCelula(celula: HTMLTableCellElement): Either<Error, LocalizadoresProcesso> {
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
  const { inicio: dtInicio, retorno: dtRetorno } = calcularRecessoData(dtA);
  const inicio = dtInicio.getTime();
  const retorno = dtRetorno.getTime();
  return Math.max(0, inicio - a) - Math.max(0, inicio - b) + Math.max(0, b - retorno);
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
    const hoje = new Date();
    return calcularAtraso(this.termoPrazoCorregedoria, hoje) / MILISSEGUNDOS_EM_UM_DIA;
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
      (this.numCompetencia >= COMPETENCIA_EF_MIN || this.numCompetencia <= COMPETENCIA_EF_MAX) &&
      (this.numClasse === CLASSE_EF || this.numClasse === CLASSE_CARTA_PRECATORIA)
    ) {
      return CompetenciasCorregedoria.EXECUCAO_FISCAL;
    }
    return CompetenciasCorregedoria.CIVEL;
  }
  get campoDataConsiderada() {
    let ret: 'dataSituacao' | 'dataUltimoEvento' | 'dataInclusaoLocalizador' = 'dataSituacao';
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
    let dias = RegrasCorregedoria[this.competenciaCorregedoria][this.situacao];
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
    const dataConsiderada = new Date(this[this.campoDataConsiderada].getTime());
    let recesso = calcularRecessoData(dataConsiderada);
    if (dataConsiderada >= recesso.inicio) {
      dataConsiderada.setTime(recesso.retorno.getTime());
    }
    const dataTermo = new Date(dataConsiderada.getTime());
    dataTermo.setDate(dataTermo.getDate() + this.prazoCorregedoria);
    while (dataTermo >= recesso.inicio) {
      dataTermo.setTime(
        dataTermo.getTime() + (recesso.retorno.getTime() - recesso.inicio.getTime())
      );
      recesso = calcularRecesso(recesso.retorno.getFullYear());
    }
    return dataTermo;
  }
}

export class ProcessoFactory {
  static fromLinha(linha: HTMLTableRowElement): Either<Error, Processo> {
    const numClasse = Maybe.fromNullable(linha.dataset.classe).map(Number);
    const numCompetencia = Maybe.fromNullable(linha.dataset.competencia).map(Number);
    const link = Maybe.fromNullable(linha.cells[1])
      .map(celula => queryOne<HTMLAnchorElement>('a', celula))
      .chain(eitherToMaybe);
    const numprocFormatado = link.chain(textContent);
    const numproc = numprocFormatado.map(replace(/[-.]/g, ''));
    const lembretes = queryAll<HTMLAnchorElement>('a', linha.cells[1]);
    const links = queryAll<HTMLAnchorElement>('a', linha.cells[1]);
    const lembretes: string[] =
      links.count() !== 2
        ? []
        : links
            .skip(1)
            .chain(l => Foldable.from(l.attributes))
            .filter(attr => attr.name === 'onmouseover')
            .limit(1)
            .reduce<Maybe<string>>((_, a) => Just(a.value), Nothing())
            .chain(match(/^return infraTooltipMostrar\('([^']+)','Lembretes',400\);$/))
            .chain(index(1))
            .map(codigoLembrete => {
              const div = document.createElement('div');
              div.innerHTML = codigoLembrete;
              return div.childNodes[0];
            })
            .filter((node): node is Element => node.nodeType === Node.ELEMENT_NODE)
            .filter((elt): elt is HTMLTableElement => elt.matches('table'))
            .map(tabela => Foldable.from(tabela.rows))
            .maybe(
              () => Foldable.empty(),
              x => x
            )
            .reverse()
            .map(linha => linha.cells[2])
            .filter((c): c is HTMLTableCellElement => c != null)
            .map(c => {
              c.innerHTML = c.innerHTML.replace(/<br.*?>/g, '\0\n');
              return c.textContent;
            })
            .filter(t => t !== null && t !== '');

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
}
