function thousandSeparator(num) {
  let [numInt, double] = num.toString().split(".")
  let result = ""
  numInt = numInt.split("").reverse()
  const numArr = []
  for (let i = 0; i < numInt.length; i++) {
    if (i % 3 === 0 && i !== 0) {
      numArr.push(",")
    }
    numArr.push(numInt[i])
  }
  numInt = numArr.reverse().join("")
  result += numInt
  if (double) {
    result += "." + double
  }
  return result
}

console.log(thousandSeparator(123456789.123))
