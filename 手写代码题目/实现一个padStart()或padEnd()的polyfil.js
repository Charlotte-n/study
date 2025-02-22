// 实现一个padStart()或padEnd()的polyfil

String.prototype.myPadStart = function (targetLen, str) {
  const originLen = str.length
  const targetL = targetLen - originLen
  let result = this
  for (let i = 0; i < targetL; i++) {
    for (let j = 0; j < originLen; j++) {
      if (targetLen === result.length) break
      result = str[j] + result
    }
    if (targetLen === result.length) break
  }
  return result
}

console.log("123".myPadStart(10, "0"))

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

console.log("123".myPadEnd(10, "0"))
