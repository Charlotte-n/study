console.log(
  flatObj({ a: { b: { c: 1, d: 2 }, e: 3 }, f: { g: 2, e: [1, 2, { a: 1 }] } })
)

function flatObj(obj) {
  const result = {}

  function flat(obj, prefix = "") {
    Object.keys(obj).forEach((key) => {
      const newKey = prefix ? `${prefix}.${key}` : key
      const value = obj[key]
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === "object" && value !== null) {
            flat(item, `${newKey}[${index}]`)
          } else {
            result[`${newKey}[${index}]`] = item
          }
        })
      } else if (typeof value === "object" && value !== null) {
        flat(value, newKey)
      } else {
        result[newKey] = value
      }
    })
  }
  flat(obj)
  return result
}
