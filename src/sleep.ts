export function sleep(ms: number): Promise<void> {
  return new Promise(res => {
    let timer = setTimeout(() => {
      clearTimeout(timer);
      res();
    }, ms);
  });
}
