export function waitUntil(p: () => boolean, ms = 100, maxAttempts = 100): Promise<void> {
  return new Promise((res, rej) => {
    let attempt = 0;
    const timer = setInterval(() => {
      if (p()) {
        clearInterval(timer);
        res();
      } else if (++attempt > maxAttempts) {
        clearInterval(timer);
        rej();
      }
    }, ms);
  });
}
