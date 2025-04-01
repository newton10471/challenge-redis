export class Serializer {
    /**
     * Converts an object to a JSON string.
     * If the object defines a `toDict()` method, that method is used.
     * Otherwise, the object itself is passed to JSON.stringify.
     */
    static serialize(obj: any): string {
      let objDict: any;
      if (obj && typeof obj.toDict === 'function') {
        objDict = obj.toDict();
      } else {
        objDict = obj;
      }
      return JSON.stringify(objDict);
    }
  
    /**
     * Converts a JSON string back into an object of type T.
     * If the class defines a static `fromDict()` method, that is used.
     * Otherwise, a new instance is created and its properties are assigned
     * from the parsed JSON object.
     */
    static deserialize<T>(
      cls: { new (): T; fromDict?(data: any): T },
      jsonStr: string
    ): T {
      const data = JSON.parse(jsonStr);
      if (cls.fromDict && typeof cls.fromDict === 'function') {
        return cls.fromDict(data);
      }
      const obj = new cls();
      Object.assign(obj, data);
      return obj;
    }
  }