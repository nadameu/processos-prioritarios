export function fromEvento<T extends HTMLElement, K extends keyof HTMLElementEventMap>(
  target: T,
  type: K
): Promise<HTMLElementEventMap[K]> {
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
