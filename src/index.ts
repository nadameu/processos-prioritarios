import { logger } from './logger';
import { main } from './main';

main().then(
  x => logger.log('Resultado:', x),
  e => logger.error(e)
);
