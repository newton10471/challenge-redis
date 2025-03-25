import { describe, it, expect } from 'vitest';
import { serializeRESP } from '../src/serializer';

describe.skip('RESP Serializer', () => {
  it('serializes simple string', () => {
    expect(serializeRESP('OK')).toBe('+OK\r\n');
  });

  it('serializes error', () => {
    expect(serializeRESP(new Error('Error message'))).toBe('-Error message\r\n');
  });

  it('serializes null bulk string', () => {
    expect(serializeRESP(null)).toBe('$-1\r\n');
  });

  it('serializes empty bulk string', () => {
    expect(serializeRESP('')).toBe('$0\r\n\r\n');
  });

  it('serializes bulk string "hello world"', () => {
    expect(serializeRESP('hello world')).toBe('$11\r\nhello world\r\n');
  });

  it('serializes array', () => {
    expect(serializeRESP(['ping'])).toBe('*1\r\n$4\r\nping\r\n');
  });
});
