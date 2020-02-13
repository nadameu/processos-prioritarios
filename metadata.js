import { concat, oneOf } from './regex';

const include = concat(
  /^/,
  'https://',
  oneOf(
    concat('eproc.jf', oneOf('pr', 'rs', 'sc'), '.jus.br/eprocV2'),
    'eproc.trf4.jus.br/eproc2trf4',
    ...(process.env.BUILD === 'development'
      ? [
          concat('homologa-', oneOf('sc', '1g1'), '.trf4.jus.br/homologa_1g'),
          'eproc-1g-develop.trf4.jus.br/eprocv2_pmj',
        ]
      : [])
  ),
  '/controlador.php?acao=',
  oneOf(
    'localizador_processos_lista',
    'localizador_orgao_listar',
    'relatorio_geral_listar',
    'texto_padrao_listar',
    'usuario_tipo_monitoramento_localizador_listar',
    concat(/[^&]+/, '&acao_origem=principal')
  ),
  '&'
);

export default {
  name: 'Processos prioritários (novo)',
  namespace: 'http://nadameu.com.br/processos-prioritarios',
  include,
  require: 'lit-html.umd.js',
  grant: 'none',
};
