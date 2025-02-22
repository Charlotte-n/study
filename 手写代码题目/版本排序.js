function isObject(obj) {
  return typeof obj === "object" && obj !== null
}
function stringify(obj, seen = new WeakSet()) {
  if (!isObject(obj)) {
    if (typeof obj === "bigint") {
      throw new Error("BigInt is not supported")
    }

    if (obj === null) {
      return "null"
    }

    if (
      typeof obj === "undefined" ||
      typeof obj === "function" ||
      typeof obj === "symbol"
    ) {
      return "undefined"
    }
    if (typeof obj === "boolean" || typeof obj === "number") {
      return obj + ""
    }
    if (typeof obj === "string") {
      return `"${obj}"`
    }
    return obj
  } else {
    if (seen.has(obj)) {
      throw new Error("Circular reference detected")
    }
    seen.add(obj)
    if (Array.isArray(obj)) {
      const result = []
      obj.forEach((item, index) => {
        if (
          typeof item === "function" ||
          typeof item === "symbol" ||
          typeof item === "undefined"
        ) {
          result[index] = undefined
        } else {
          result[index] = stringify(item, seen)
        }
      })
      return `[${result.join(",")}]`
    } else {
      const result = {}
      Object.keys(obj).forEach((key) => {
        result[key] = stringify(obj[key], seen)
      })

      return `{${Object.keys(result)
        .map((key) => `${key}:${result[key]}`)
        .join(",")}}`
    }
  }
}

function parse(str) {
  //   if (str === "") {
  //     throw new Error()
  //   }

  //   if (str[0] === "'") {
  //     throw new Error()
  //   }

  if (str === "[]") {
    return []
  }
  if (str === "{}") {
    return {}
  }
  if (str === "null") {
    return null
  }
  if (str === "undefined") {
    return undefined
  }
  if (str === "true") {
    return true
  }
  if (str === "false") {
    return false
  }
  if (+str === +str) {
    return +str
  }
  if (str[0] === '"') {
    return str.slice(1, -1)
  }
  if (str[0] === "[") {
    return str
      .slice(1, -1)
      .split(",")
      .map((item) => parse(item))
  }
  if (str[0] === "{") {
    console.log(str.slice(1, -1).match(/[^,]+:[^,]+/g), 123)
    return str
      .slice(1, -1)
      .match(/[^,]+:[^,]+/g)
      .reduce((pre, curr) => {
        const [key, value] = curr.split(":")
        pre[parse(key)] = parse(value)
        return pre
      }, {})
  }
}

const str = stringify({
  a: 1,
  b: 2,
  c: 3,
  d: [
    1,
    2,
    3,
    4,
    5,
    {
      e: 123,
    },
  ],
})
// console.log(typeof str)
console.log(parse(str))
