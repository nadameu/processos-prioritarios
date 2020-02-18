import { logger } from './logger';

export interface Dispatch<Msg> {
  (msg: Msg): void;
}

export interface Cmd<Msg> {
  (dispatch: Dispatch<Msg>): void;
}

export function core<Model, Msg>(
  init: () => [Model, Cmd<Msg>?],
  update: (model: Model, msg: Msg) => [Model, Cmd<Msg>?],
  view: (dispatch: Dispatch<Msg>) => (model: Model) => void
) {
  let [state, cmd] = init();
  const onchange = view(dispatch);
  render();

  function dispatch(msg: Msg) {
    logger.debug('dispatch', msg);
    [state, cmd] = update(state, msg);
    render();
  }

  function render() {
    logger.debug('state', state);
    onchange(state);
    if (cmd) Promise.resolve(cmd).then(cmd => cmd(dispatch));
  }
}
