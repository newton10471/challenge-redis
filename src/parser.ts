import { U } from "vitest/dist/chunks/environment.d.C8UItCbf.js";

class SimpleString {
  private readonly encoder = new TextEncoder();

  constructor(public data: string) {
    this.data = data;
  }

  encode(): Uint8Array {
    return this.encoder.encode(`+${this.data}\r\n`);
  }
}

class Parser {
  private _position: number;

  constructor(private _buffer: Uint8Array) {
    console.log("BUFFER1: ", _buffer);

    this._buffer = _buffer;
    this._position = 0;
  }

  parse_frame(): string {
    const [msg, pos] = this.parse_msg();
    return msg.data;
  }

  parse_msg(): any {
    console.log("BUFFER2: ", this._buffer);
    const type = this._buffer[this._position];
    console.log("TYPE: ", type);
    switch (type) {
      case "+": 
        return this.parse_simple_string();
      default:
        throw new Error(`Unknown RESP type: ${type}`);
    }
  }

  parse_simple_string(): [SimpleString | null, number] {
    const start = this._position + 1;
    this._advance();
    this._parse_text();
    const end = this._parse_eos();
    if (end !== -1) {
      const simpleString = new SimpleString(this._buffer.slice(start, this._position - 2));
      return [simpleString, this._position];
    }
    return [null, 0];
  }

  _advance(n: number = 1): void {
    this._position += n;
  }

  // Helper function to check if a character is alphanumeric, intentionally synonymouse with Python's str.isalnum()
  private _isAlnum(char: string): boolean {
    return /^[a-zA-Z0-9]$/.test(char);
  }

  _parse_text(): void {
    while (
      this._position < this._buffer.length - 1 &&
      this._isAlnum(this._buffer[this._position])
    ) {
      this._advance();
    }
  }

  _parse_eos(): number {
    if (this._buffer.slice(this._position, this._position + 2) === "\r\n") {
      this._advance(2);
      return this._position;
    }
    return -1;
  }

}

export { SimpleString, Parser };