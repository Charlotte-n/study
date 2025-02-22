const isObject = (ob) => typeof ob === "object" && ob !== null
function stringify(obj, set = new Set()) {
  if (!isObject(obj)) {
    if (obj === null) {
      return "null"
    }
    if (typeof obj === "bigint") {
      throw new Error("BigInt is not supported")
    }
    if (
      typeof obj === "undefined" ||
      typeof obj === "function" ||
      typeof obj === "symbol"
    ) {
      return "undefined"
    }
    if (typeof obj === "number" || typeof obj === "boolean") {
      return obj + ""
    }
    if (typeof obj === "string") {
      return `"${obj}"`
    }
  } else {
    if (Array.isArray(obj)) {
      if (set.has(obj)) {
        throw new Error("Circular reference not supported")
      }
      set.add(obj)
      let result = []
      obj.forEach((item, index) => {
        if (
          typeof item === "function" ||
          typeof item === "symbol" ||
          typeof item === "undefined"
        ) {
          result[index] = undefined
        } else {
          result[index] = stringify(item, set)
        }
      })
      return `[${result.join(",")}]`
    } else {
      if (set.has(obj)) {
        throw new Error("Circular reference not supported")
      }
      set.add(obj)
      const result = {}
      Object.keys(obj).forEach((key) => {
        result[key] = stringify(obj[key], set)
      })
      return `{
                ${Object.keys(result)
                  .map((key) => `${key}:${result[key]}`)
                  .join(",")}
            }`
    }
  }
}
