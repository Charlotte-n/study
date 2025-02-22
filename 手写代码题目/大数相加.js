// 题目
let a = "9007199254740991"
let b = "1234567899999999999"

function bigIntAdd(a, b) {
  const len = Math.max(a.length, b.length)
  a = a.padStart(len, "0")
  b = b.padStart(len, "0")
  let carry = 0
  let result = ""
  for (let i = len - 1; i >= 0; i--) {
    const sum = parseInt(a[i]) + parseInt(b[i]) + carry
    const num = sum % 10
    carry = Math.floor(sum / 10)
    result = num + result
  }
  return result
}

console.log(bigIntAdd(a, b))
