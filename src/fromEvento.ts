/**
 * Exemplo:
 * ```
 * await fromEvento(window, 'load');
 * ```
 */
export function fromEvento<T extends HTMLElement, K extends keyof HTMLElementEventMap>(
  target: T,
  type: K
): Promise<HTMLElementEventMap[K]>;
export function fromEvento<K extends keyof WindowEventMap>(
  target: Window,
  type: K
): Promise<WindowEventMap[K]>;
export function fromEvento<T extends EventTarget>(target: T, type: string): Promise<Event>;
export function fromEvento<T extends EventTarget>(target: T, type: string): Promise<Event> {
  return new Promise(res => {
    target.addEventListener(
      type,
      evt => {
        res(evt);
      },
      { once: true }
    );
  });
}
