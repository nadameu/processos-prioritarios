export function bits(
  from: number | [number, number],
  to: number | [number, number],
  source: ArrayLike<number> | Iterable<number>,
  limit?: number
) {
  const { bits: srcBits, element: srcElement } = decode(from);
  const { bits: destBits, element: destElement } = decode(to);
  const array = Array.from(source);
  if (limit === undefined) limit = Math.floor((array.length * srcElement) / srcBits);
  let input = '';
  let output = '';
  const dest: number[] = [];
  for (const element of array) {
    input += element
      .toString(2)
      .slice(-srcElement)
      .padStart(srcElement, '0');
    while (input.length >= srcBits) {
      output += input
        .slice(0, srcBits)
        .slice(-destBits)
        .padStart(destBits, '0');
      input = input.slice(srcBits);
    }
    while (output.length >= destElement) {
      dest.push(parseInt(output.slice(0, destElement), 2));
      output = output.slice(destElement);
    }
  }
  if (output.length > 0) {
    dest.push(parseInt(output.padEnd(destElement, '0'), 2));
  }
  return dest.slice(0, Math.ceil((limit * destBits) / destElement));

  function decode(value: number | [number, number]) {
    if (typeof value === 'number') return { bits: value, element: value };
    if (!Array.isArray(value)) throw new TypeError();
    if (value.length !== 2) throw new TypeError();
    const [bits, element] = value;
    return { bits, element };
  }
}

export function comprimir(str: string): Uint8Array {
  const stream = Array.from(encodeStream(bitsToBytes(stringToBits(str))));
  console.log(stream);
  return Uint8Array.from(bitsToBytes(stream));

  function* encodeStream(bytes: Iterable<number>): IterableIterator<Bit> {
    const heap = createHeap(8);
    heap.fill(1);
    let [start, end]: [number, number] = [0, 1];
    for (const byte of bytes) {
      let emitted = 0;
      const indices: Bit[] = [];
      for (const bit of byteToBits(byte)) {
        const [p0] = heap.probabilities(indices);
        if (bit === 0) {
          end = lerp(start, end, p0);
        } else {
          start = lerp(start, end, p0);
        }
        indices.push(bit);
        if (end <= 0.5) {
          yield 0;
          emitted++;
          heap.set(indices, heap.get(indices) + 1);
          [start, end] = [start, end].map(x => lerp(0, 2, x));
        } else if (start >= 0.5) {
          yield 1;
          emitted++;
          heap.set(indices, heap.get(indices) + 1);
          [start, end] = [start, end].map(x => lerp(-1, 1, x));
        }
      }
      console.log({ start, end, emitted });
    }
    console.log({ start, end });
    for (let i = 0; i < 7; i++) yield 0;
  }
}

export function descomprimir(view: Uint8Array): string {
  return bitsToString(decodeBits(view as any));

  function* decodeBits(bits: Iterable<Bit>) {
    const heap = createHeap(8);
    heap.fill(1);
    let [start, end]: [number, number] = [0, 1];
    for (const byte of bytes) {
      let emitted = 0;
      const indices: Bit[] = [];
      for (const bit of byteToBits(byte)) {
        const [p0] = heap.probabilities(indices);
        if (bit === 0) {
          end = p0;
        } else {
          start = p0;
        }
        indices.push(bit);
        if (end <= 0.5) {
          yield 0;
          emitted++;
          heap.set(indices, heap.get(indices) + 1);
          [start, end] = [start, end].map(x => lerp(0, 2, x));
        } else if (start >= 0.5) {
          yield 1;
          emitted++;
          heap.set(indices, heap.get(indices) + 1);
          [start, end] = [start, end].map(x => lerp(-1, 1, x));
        }
      }
      console.log({ start, end, emitted });
    }
    console.log({ start, end });
    for (let i = 0; i < 7; i++) yield 0;
  }
}

export function lerp(min: number, max: number, fraction: number) {
  return ((256 * (min + fraction * (max - min))) | 0) / 256;
}

export function stringToByteArray(text: string) {
  return Uint8Array.from(bitsToBytes(stringToBits(text)));
}

export function bitsToString(bits: Iterable<0 | 1>) {
  return Array.from(bytesToChars(bitsToBytes(bits))).join('');
}

export function bytesToString(codes: Iterable<number>) {
  return Array.from(bytesToChars(codes)).join('');
}

function* bitsToBytes(bits: Iterable<0 | 1>) {
  let output: number[] = [];
  for (const bit of bits) {
    output.push(bit);
    if (output.length === 8) {
      yield output.reduce((acc, x, i) => acc | (x << (7 - i)), 0);
      output = [];
    }
  }
}

function* bytesToChars(codes: Iterable<number>) {
  let output: number[] = [];
  for (const code of codes) {
    output.push(code);
    if (output.length === 2) {
      yield String.fromCharCode(new Uint16Array(Uint8Array.from(output))[0]);
      output = [];
    }
  }
}

export function* stringToBits(text: string) {
  const view16 = new Uint16Array(1);
  const view8 = new Uint8Array(view16.buffer);
  const length = text.length;
  for (let i = 0; i < length; i++) {
    view16[0] = text.charCodeAt(i);
    yield* byteToBits(view8[0]);
    yield* byteToBits(view8[1]);
  }
}

function* byteToBits(byte: number) {
  const string = byte.toString(2);
  const length = string.length;
  for (let i = length; i < 8; i++) yield 0 as Bit;
  for (let i = 0; i < length; i++) yield Number(string[i]) as Bit;
}

type Bit = 0 | 1;
export interface Heap {
  fill(value: number): void;
  get(indices: Bit[]): number;
  probabilities(indices: Bit[]): [number, number];
  set(indices: Bit[], value: number): void;
  toArray(): number[];
}
export function createHeap(levels: number): Heap {
  const arrayLength = Math.pow(2, levels + 1) - 1;
  const array = Array(arrayLength);
  return { fill, get, set, probabilities, toArray };
  function fill(value: number) {
    for (let i = 1; i < arrayLength; i++) array[i] = value;
  }
  function get(indices: Bit[]) {
    return array[index(indices)];
  }
  function set(indices: Bit[], value: number) {
    array[index(indices)] = value;
  }
  function toArray() {
    return array.slice(1);
  }
  function probabilities(indices: Bit[]) {
    const zero = get([...indices, 0]);
    const one = get([...indices, 1]);
    const pZero = zero / (zero + one);
    return [pZero, 1 - pZero] as [number, number];
  }
  function index(indices: Bit[]) {
    return indices.reduce((acc: number, x) => acc * 2 + x + 1, 0);
  }
}
