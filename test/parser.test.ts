// parser.test.ts
import { describe, test, expect } from "vitest";
import { Parser, ParseError, SimpleString, Error, Integer, BulkString, Array } from "./src/parser";

describe("Parser.parseFrame", () => {
  // Each test case holds a Buffer and the expected result: a tuple [message, bytesRead]
  const cases: { buffer: Buffer; expected: [any, number] }[] = [
    // Simple String
    { buffer: Buffer.from("+part"), expected: [null, 0] },
    { buffer: Buffer.from("+full\r\n"), expected: [new SimpleString("full"), 7] },
    { buffer: Buffer.from("+full\r\n+par"), expected: [new SimpleString("full"), 7] },
    // Errors
    { buffer: Buffer.from("-e"), expected: [null, 0] },
    { buffer: Buffer.from("-Error\r\n"), expected: [new Error("Error"), 8] },
    { buffer: Buffer.from("-Error\r\n+par"), expected: [new Error("Error"), 8] },
    // Integers
    { buffer: Buffer.from(":10"), expected: [null, 0] },
    { buffer: Buffer.from(":100\r\n"), expected: [new Integer(100), 6] },
    { buffer: Buffer.from(":100\r\n+OK"), expected: [new Integer(100), 6] },
    // BulkString
    { buffer: Buffer.from("$5\r\nHel"), expected: [null, 0] },
    { buffer: Buffer.from("$5\r\nHello\r\n"), expected: [new BulkString("Hello"), 11] },
    { buffer: Buffer.from("$12\r\nHello, World\r\n"), expected: [new BulkString("Hello, World"), 19] },
    { buffer: Buffer.from("$12\r\nHello\r\nWorld\r\n"), expected: [new BulkString("Hello\r\nWorld"), 19] },
    // Array
    { buffer: Buffer.from("*2\r\n$5\r\nhello\r\n$5\r\n"), expected: [null, 0] },
    {
      buffer: Buffer.from("*2\r\n$5\r\nhello\r\n$5\r\nworld\r\n"),
      expected: [new Array([new BulkString("hello"), new BulkString("world")]), 26],
    },
    {
      buffer: Buffer.from("*2\r\n$5\r\nhello\r\n$5\r\nworld\r\n+OK"),
      expected: [new Array([new BulkString("hello"), new BulkString("world")]), 26],
    },
    {
      buffer: Buffer.from("*3\r\n*1\r\n$6\r\nnested\r\n$5\r\nhello\r\n$5\r\nworld\r\n+OK"),
      expected: [
        new Array([
          new Array([new BulkString("nested")]),
          new BulkString("hello"),
          new BulkString("world"),
        ]),
        42,
      ],
    },
  ];

  cases.forEach(({ buffer, expected }, index) => {
    test(`parseFrame test case ${index + 1}`, () => {
      const parser = new Parser(buffer);
      const got = parser.parseFrame();
      expect(got).toEqual(expected);
    });
  });
});

describe("Parser parse errors", () => {
  test("parse_frame_error_bulkstr", () => {
    const buffer = Buffer.from("$hello\r\n");
    const parser = new Parser(buffer);
    expect(() => parser.parseFrame()).toThrowError(/Expected an integer/);
  });

  test("parse_frame_error_arr", () => {
    const buffer = Buffer.from("*f22\r\nstring\r\n");
    const parser = new Parser(buffer);
    expect(() => parser.parseFrame()).toThrowError(/Expected an integer/);
  });

  test("parse_frame_unexpected_type", () => {
    const buffer = Buffer.from("%Unknown\r\n");
    const parser = new Parser(buffer);
    expect(() => parser.parseFrame()).toThrowError(/Unexpected type code/);
  });
});

describe("encode messages", () => {
  const cases: { message: any; expected: Buffer }[] = [
    { message: new SimpleString("OK"), expected: Buffer.from("+OK\r\n") },
    { message: new Error("Error"), expected: Buffer.from("-Error\r\n") },
    { message: new Integer(100), expected: Buffer.from(":100\r\n") },
    {
      message: new BulkString("This is a Bulk String"),
      expected: Buffer.from("$21\r\nThis is a Bulk String\r\n"),
    },
    { message: new BulkString(""), expected: Buffer.from("$0\r\n\r\n") },
    { message: new BulkString(null), expected: Buffer.from("$-1\r\n") },
    { message: new Array([]), expected: Buffer.from("*0\r\n") },
    { message: new Array(null), expected: Buffer.from("*-1\r\n") },
    {
      message: new Array([new SimpleString("String"), new Integer(2), new SimpleString("String2")]),
      expected: Buffer.from("*3\r\n+String\r\n:2\r\n+String2\r\n"),
    },
  ];

  cases.forEach(({ message, expected }, index) => {
    test(`encode message test case ${index + 1}`, () => {
      expect(message.encode()).toEqual(expected);
    });
  });
});
