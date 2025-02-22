String.prototype.myPadStart = function (targetLen, str) {
  const originLen = str.length
  const targetL = targetLen - originLen
  let result = this
  let s = ""
  for (let i = 0; i < targetL; i++) {
    for (let j = 0; j < originLen; j++) {
      if (targetL === s.length) break
      s = str[j] + s
    }
    if (targetL === s.length) break
  }
  result = s.split("").reverse().join("") + result
  return result
}

String.prototype.myPadStart = function (targetLen, padString = " ") {
  if (!targetLen) {
    throw new Error("请传入需要填充的长度")
  }
  const padStrLen = padString.length
  if (!padStrLen) return this

  const originLen = this.length
  const prefixLen = Math.max(0, targetLen - originLen)
  const repeatTimes = Math.ceil(prefixLen / padStrLen)
  return `${padString.repeat(repeatTimes).substring(0, prefixLen)}${this}`
}

console.log("123".myPadStart(10, "abc"))
console.log("123".padStart(10, "abc"))

String.prototype.myPadEnd = function (targetLen, str) {
  const originLen = str.length
  const targetL = targetLen - originLen
  let result = this
  for (let i = 0; i < targetL; i++) {
    for (let j = 0; j < originLen; j++) {
      if (targetLen === result.length) break
      result = result + str[j]
    }
    if (targetLen === result.length) break
  }
  return result
}

console.log("123".myPadEnd(10, "abc"))
console.log("123".padEnd(10, "abc"))
