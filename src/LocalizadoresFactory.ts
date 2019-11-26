import { GUI } from './GUI';
import { queryAll } from './Query/queryAll';
import { isContained } from './Util/isContained';
import { parseCookies } from './Util/parseCookies';
import { Maybe } from './Maybe';

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
export class Localizador {
  constructor(
    readonly id: never,
    readonly linha: never,
    readonly link: never,
    readonly nome: never,
    readonly processos: never,
    readonly quantidadeProcessosNaoFiltrados: never,
    readonly sigla: never,
    readonly siglaNome: never
  ) {}

  get quantidadeProcessos() {
    return Number(this.link.textContent);
  }

  excluirPrazosAbertos() {
    const link = this.link;
    if (!link.href) {
      return Promise.resolve(this);
    }
    return this.obterPrazosPagina(0).then(() => {
      this.link.textContent = this.processos.length;
      return this;
    });
  }
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
  }
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
  }
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
  }
}
export class LocalizadorFactory {
  static fromLinha(linha: HTMLTableRowElement) {
    const separador = ' - ';
    const siglaNome = Maybe.fromNullable<HTMLTableCellElement>(linha.cells[0])
      .mapFalsy(c => c.textContent)
      .map(t => t.split(separador));
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
  }

  static fromLinhaPainel(linha: HTMLTableRowElement) {
    const localizador = new Localizador();
    localizador.linha = linha;
    localizador.nome = linha.cells[0].textContent.match(/^Processos com Localizador\s+"(.*)"$/)[1];
    const link = (localizador.link = linha.querySelector('a,u'));
    localizador.quantidadeProcessosNaoFiltrados = parseInt(link.textContent);
    if (link && link.href) {
      const camposGet = new URL(link.href).searchParams;
      localizador.id = camposGet.get('selLocalizador');
    }
    return localizador;
  }
}
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

export class Localizadores {
  constructor(readonly tabela: HTMLTableElement, readonly localizadores: Localizador[]) {}

  get quantidadeProcessos() {
    return this.localizadores.reduce(
      (soma, localizador) => soma + localizador.quantidadeProcessos,
      0
    );
  }
  get quantidadeProcessosNaoFiltrados() {
    return this.localizadores.reduce(
      (soma, localizador) => soma + localizador.quantidadeProcessosNaoFiltrados,
      0
    );
  }

  forEach(f: (_: Localizador) => void): void {
    this.localizadores.forEach(f);
  }
  obterProcessos() {
    return paraCadaLocalizador.call(this, localizador => localizador.obterProcessos());
  }
}

export class LocalizadoresFactory {
  static fromTabela(tabela: HTMLTableElement) {
    return new Localizadores(
      tabela,
      queryAll<HTMLTableRowElement>('tr[class^="infraTr"]', tabela).map(
        LocalizadorFactory.fromLinha
      )
    );
  }

  static fromTabelaPainel(tabela: HTMLTableElement) {
    return new Localizadores(
      tabela,
      Array.from(
        tabela.querySelectorAll<HTMLTableRowElement>('tr[class^="infraTr"]'),
        LocalizadorFactory.fromLinhaPainel
      )
    );
  }
}
