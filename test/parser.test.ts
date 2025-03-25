import { describe, it, expect } from 'vitest';
import { parseRESP } from '../src/parser';

describe('RESP Parser', () => {
  it('parses null bulk string', () => {
    expect(parseRESP('$-1\r\n')).toEqual(null);
  });

  it('parses simple string', () => {
    expect(parseRESP('+OK\r\n')).toEqual('OK');
  });

  it('parses bulk string', () => {
    expect(parseRESP('$5\r\nhello\r\n')).toEqual('hello');
  });

  it.skip('parses null array', () => {
    console.log("THIS SHOULD NOT RUN");
    expect(parseRESP('*-1\r\n')).toEqual(null);
  });

  it('parses simple array with one bulk string', () => {
    expect(parseRESP('*1\r\n$4\r\nping\r\n')).toEqual(['ping']);
  });

  it.skip('parses ECHO command', () => {
    expect(parseRESP('*2\r\n$4\r\necho\r\n$11\r\nhello world\r\n')).toEqual(['echo', 'hello world']);
  });

  it.skip('parses GET command', () => {
    expect(parseRESP('*2\r\n$3\r\nget\r\n$3\r\nkey\r\n')).toEqual(['get', 'key']);
  });

  it.skip('throws on malformed input', () => {
    expect(() => parseRESP('*2\r\n$3\r\nbad')).toThrow();
  });
});
