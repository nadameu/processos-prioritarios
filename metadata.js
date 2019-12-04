import { concat, oneOf } from './regex';

const include = concat(
  /^/,
  'https://',
  oneOf(
    concat('eproc.jf', oneOf('pr', 'rs', 'sc'), '.jus.br/eprocV2'),
    'eproc.trf4.jus.br/eproc2trf4',
    ...(process.env.BUILD === 'development' ? ['homologa-sc.trf4.jus.br/homologa_1g'] : [])
  ),
  '/controlador.php?acao=',
  oneOf(
    'usuario_tipo_monitoramento_localizador_listar',
    'localizador_processos_lista',
    'localizador_orgao_listar',
    'relatorio_geral_listar',
    concat(/[^&]+/, '&acao_origem=principal')
  ),
  '&'
);

export default {
  name: 'Processos prioritários',
  namespace: 'http://nadameu.com.br/processos-prioritarios',
  include,
  grant: 'none'
};
