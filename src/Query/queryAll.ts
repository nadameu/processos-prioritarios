export const queryAll = <T extends Element>(selector: string, context: ParentNode): Array<T> =>
  Array.from(context.querySelectorAll<T>(selector));
