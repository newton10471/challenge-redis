import { describe, it, expect } from "vitest";
import { Serializer } from "./src/serializer.ts";

// A sample class with custom toDict/fromDict methods.
class Dummy {
  name: string;
  value: number;

  constructor(name?: string, value?: number) {
    this.name = name || "";
    this.value = value || 0;
  }

  toDict(): object {
    return { name: this.name, value: this.value };
  }

  static fromDict(data: { name: string; value: number }): Dummy {
    return new Dummy(data.name, data.value);
  }
}

// A simple class without custom serialization methods.
class Simple {
  foo: string;

  constructor() {
    this.foo = "bar";
  }
}

describe("Serializer", () => {
  it("should serialize using toDict if available", () => {
    const dummy = new Dummy("test", 123);
    const jsonStr = Serializer.serialize(dummy);
    expect(JSON.parse(jsonStr)).toEqual({ name: "test", value: 123 });
  });

  it("should deserialize using fromDict if available", () => {
    const jsonStr = '{"name": "test", "value": 123}';
    const obj = Serializer.deserialize(Dummy, jsonStr);
    expect(obj).toBeInstanceOf(Dummy);
    expect(obj.name).toBe("test");
    expect(obj.value).toBe(123);
  });

  it("should serialize an object without toDict", () => {
    const simple = new Simple();
    const jsonStr = Serializer.serialize(simple);
    expect(JSON.parse(jsonStr)).toEqual({ foo: "bar" });
  });

  it("should deserialize an object without fromDict", () => {
    const jsonStr = '{"foo": "bar"}';
    const obj = Serializer.deserialize(Simple, jsonStr);
    expect(obj).toBeInstanceOf(Simple);
    expect(obj.foo).toBe("bar");
  });
});