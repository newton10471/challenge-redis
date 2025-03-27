function parseRESP(input: string): any {
  switch (input[0]) {
    case '+': // simple string
      return parseSimpleString(input);
    case '-': // error
      return parseError(input);
    case ':': // integer
      return parseInteger(input);
    case '$': // bulk string
      return parseBulkString(input);
    case '*': // array
      return parseArray(input);
    default:
      return null;
  }
}

function parseSimpleString(input: string): string {
  return input.slice(1, -2);
}

//function parseError(input: string): Error {
//  return new Error(input.slice(1, -2));
//}

//function parseInteger(input: string): number {
//  return Number(input.slice(1, -2));
//}

function parseBulkString(input: string): string | null {
  const length = Number(input.slice(1, input.indexOf('\r\n')));
  if (length === -1) {
    return null;
  }
  const start = input.indexOf('\r\n') + 2;
  return input.slice(start, start + length);
}

function parseArray(input: string): any[] | null {
  const length = Number(input.slice(1, input.indexOf('\r\n')));
  if (length === -1) {
    return null;
  }
  let start = input.indexOf('\r\n') + 2;
  const result = [];
  for (let i = 0; i < length; i++) {
    const item = parseRESP(input.slice(start));
    result.push(item);

    // Update `start` to point to the next item
    const itemLength = input.slice(start).indexOf('\r\n') + 2;
    start += itemLength + (itemLength > 0 ? input.slice(start + itemLength).indexOf('\r\n') + 2 : 0);
  }
  return result;
}

export { parseRESP };
