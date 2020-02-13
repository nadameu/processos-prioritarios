import { logger } from './logger';
import { main } from './main';

main().then(
  x => {
    if (Boolean(x)) logger.log('Resultado:', x);
  },
  e => logger.error(e)
);
