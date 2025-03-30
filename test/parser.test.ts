import { describe, it, expect } from 'vitest';
import { SimpleString, Parser } from '../src/parser.ts';

describe('RESP Parser', () => {
  it('parses simple string', () => {
    const parser = new Parser("+OK\r\n");
    expect(parser.parse_frame()).toEqual('OK');
  });
});