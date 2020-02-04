import { main } from './main';
import { logger } from './logger';

main().then(
  x => logger.log('Resultado:', x),
  e => logger.error(e)
);
