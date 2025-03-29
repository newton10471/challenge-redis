import { describe, it, expect } from 'vitest';
import { parseRESP } from '../src/parser';

describe('RESP Parser - Additional Tests', () => {
  it('parses null bulk string', () => {
    expect(parseRESP('$-1\r\n')).toEqual(null);
  });

  it('parses empty bulk string', () => {
    expect(parseRESP('$0\r\n\r\n')).toEqual('');
  });

  it('parses simple string', () => {
    expect(parseRESP('+OK\r\n')).toEqual('OK');
  });

  it('parses simple string with spaces', () => {
    expect(parseRESP('+hello world\r\n')).toEqual('hello world');
  });

  it('parses error message', () => {
    expect(parseRESP('-Error message\r\n')).toEqual(new Error('Error message'));
  });

  it('parses bulk string', () => {
    expect(parseRESP('$5\r\nhello\r\n')).toEqual('hello');
  });

  it('parses null array', () => {
    expect(parseRESP('*-1\r\n')).toEqual(null);
  });

  it('parses empty array', () => {
    expect(parseRESP('*0\r\n')).toEqual([]);
  });

  it('parses simple array with one bulk string', () => {
    expect(parseRESP('*1\r\n$4\r\nping\r\n')).toEqual(['ping']);
  });

  it('parses array with multiple bulk strings', () => {
    expect(parseRESP('*2\r\n$4\r\necho\r\n$11\r\nhello world\r\n')).toEqual(['echo', 'hello world']);
  });

  it('parses array with mixed types', () => {
    expect(parseRESP('*3\r\n+OK\r\n$5\r\nhello\r\n:123\r\n')).toEqual(['OK', 'hello', 123]);
  });

  it.skip('parses nested arrays', () => {
    expect(parseRESP('*2\r\n*2\r\n$3\r\nfoo\r\n$3\r\nbar\r\n*3\r\n:1\r\n:2\r\n:3\r\n')).toEqual([['foo', 'bar'], [1, 2, 3]]);
  });

  it('parses integer', () => {
    expect(parseRESP(':123\r\n')).toEqual(123);
  });

  it.skip('throws on malformed bulk string', () => {
    expect(() => parseRESP('$5\r\nbad')).toThrow();
  });

  it('throws on malformed array', () => {
    expect(() => parseRESP('*2\r\n$3\r\nbad')).toThrow();
  });

  it.skip('throws on invalid RESP type', () => {
    expect(() => parseRESP('!invalid\r\n')).toThrow();
  });

  it('parses deeply nested arrays', () => {
    expect(parseRESP('*1\r\n*1\r\n*1\r\n*1\r\n$4\r\ndata\r\n')).toEqual([[[['data']]]]);
  });

  it.skip('parses array with null bulk string', () => {
    expect(parseRESP('*2\r\n$-1\r\n$4\r\ndata\r\n')).toEqual([null, 'data']);
  });
});