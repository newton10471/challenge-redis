export class SimpleString {
  constructor(public data: string) { }
  encode(): Buffer {
    return Buffer.from(`+${this.data}\r\n`);
  }
}

//
// NOTE: We cannot use the name "Error" because that conflicts with the built‐in Error.
// We define our RESP error message class as RespError and then export it as Error.
//
export class RespError {
  constructor(public data: string) { }
  encode(): Buffer {
    return Buffer.from(`-${this.data}\r\n`);
  }
}
export { RespError as Error };

export class Integer {
  constructor(public val: number) { }
  encode(): Buffer {
    return Buffer.from(`:${this.val}\r\n`);
  }
}

export class BulkString {
  // data can be a string or null.
  constructor(public data: string | null) { }
  encode(): Buffer {
    if (this.data === null) {
      return Buffer.from(`$-1\r\n`);
    }
    return Buffer.from(`$${this.data.length}\r\n${this.data}\r\n`);
  }
}

// Because "Array" is a built‐in type in JavaScript we use a different name internally
// and then export it as "Array" for compatibility with the tests.
export class RespArray {
  // data is an array of messages (or null).
  constructor(
    public data:
      | (SimpleString | Integer | BulkString | RespArray | RespError)[]
      | null
  ) { }
  encode(): Buffer {
    if (this.data === null) {
      return Buffer.from(`*-1\r\n`);
    }
    const parts: Buffer[] = [];
    parts.push(Buffer.from(`*${this.data.length}\r\n`));
    for (const msg of this.data) {
      parts.push(msg.encode());
    }
    return Buffer.concat(parts);
  }
}
export { RespArray as Array };

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ParseError.prototype);
  }
}

// Helper function (mimics the Python "match")
function match(got: any, expected: any): boolean {
  return got === expected;
}

export class Parser {
  private pos: number = 0;
  constructor(private buffer: Buffer) { }

  parseFrame(): [any, number] {
    return this.parseMsg();
  }

  private parseMsg(): [any, number] {
    const char = String.fromCharCode(this.buffer[this.pos]);
    if (char === "+") return this.parseSimpleStr();
    if (char === "-") return this.parseError();
    if (char === ":") return this.parseInteger();
    if (char === "$") return this.parseBulkStr();
    if (char === "*") return this.parseArray();
    throw new ParseError(`Unexpected type code ${char}`);
  }

  private parseSimpleStr(): [SimpleString | null, number] {
    const start = this.pos + 1;
    this.advance();
    this.parseText();
    const end = this.parseEos();
    if (end !== -1) {
      // The text is between start and (current position - 2)
      const data = this.buffer.slice(start, this.pos - 2).toString();
      return [new SimpleString(data), this.pos];
    }
    return [null, 0];
  }

  private parseError(): [RespError | null, number] {
    const start = this.pos + 1;
    this.advance();
    this.parseText();
    const end = this.parseEos();
    if (end !== -1) {
      const data = this.buffer.slice(start, this.pos - 2).toString();
      return [new RespError(data), this.pos];
    }
    return [null, 0];
  }

  private parseInteger(): [Integer | null, number] {
    const start = this.pos + 1;
    this.advance();
    this.parseDigits();
    const numStr = this.buffer.slice(start, this.pos).toString();
    const value = parseInt(numStr, 10);
    if (isNaN(value)) {
      throw new ParseError(
        `Expected an integer, got ${this.buffer.slice(1, this.pos).toString()}`
      );
    }
    const end = this.parseEos();
    if (end !== -1) {
      return [new Integer(value), this.pos];
    }
    return [null, 0];
  }

  private parseBulkStr(): [BulkString | null, number] {
    const start = this.pos + 1;
    this.advance();
    this.parseDigits();
    const lenStr = this.buffer.slice(start, this.pos).toString();
    const bulkStrLength = parseInt(lenStr, 10);
    if (isNaN(bulkStrLength)) {
      throw new ParseError(
        `Expected an integer, got ${this.buffer.slice(1, this.pos).toString()}`
      );
    }
    const i = this.parseEos();
    if (i === 0) return [null, 0];
    const textStart = i;
    if (this.buffer.length < bulkStrLength + i + 2) return [null, 0];
    this.advance(bulkStrLength);
    const j = this.parseEos();
    if (j === 0) return [null, 0];
    const bulkStringData = this.buffer
      .slice(textStart, textStart + bulkStrLength)
      .toString();
    return [new BulkString(bulkStringData), j];
  }

  private advance(n: number = 1): void {
    this.pos += n;
  }

  private parseText(): void {
    while (
      this.pos < this.buffer.length - 1 &&
      /[A-Za-z0-9]/.test(String.fromCharCode(this.buffer[this.pos]))
    ) {
      this.advance();
    }
  }

  private parseEos(): number {
    if (
      this.pos + 1 < this.buffer.length &&
      this.buffer.slice(this.pos, this.pos + 2).toString() === "\r\n"
    ) {
      this.advance(2);
      return this.pos;
    }
    return -1;
  }

  private parseDigits(): void {
    while (
      this.pos < this.buffer.length - 1 &&
      /[0-9]/.test(String.fromCharCode(this.buffer[this.pos]))
    ) {
      this.advance();
    }
  }

  private parseArray(): [RespArray | null, number] {
    const start = this.pos + 1;
    this.advance();
    this.parseDigits();
    const numStr = this.buffer.slice(start, this.pos).toString();
    const arrLength = parseInt(numStr, 10);
    if (isNaN(arrLength)) {
      throw new ParseError(
        `Expected an integer, got ${this.buffer.slice(1, this.pos).toString()}`
      );
    }
    const i = this.parseEos();
    if (i === 0) return [null, 0];
    const arr: (SimpleString | Integer | BulkString | RespArray | RespError)[] =
      [];
    for (let k = 0; k < arrLength; k++) {
      const [nextItem, length] = this.parseFrame();
      if (nextItem !== null && length !== 0) {
        arr.push(nextItem);
      } else {
        return [null, 0];
      }
    }
    return [new RespArray(arr), this.pos];
  }
}
