// 怎么在制定数据源里面生成一个长度为 n 的不重复随机数组 能有几种方法 时间复杂度多少（字节）

//方法一
function getRandomArray(arr, n) {
  const result = []

  for (let i = 0; i < n; i++) {
    const random = Math.floor(Math.random() * arr.length)
    if (result.includes(arr[random])) {
      i--
      continue
    }
    if (result.length === n) break
    result.push(arr[random])
  }
  return result
}

//方法二
function getRandomArray2(arr, n) {
  const hash = {}
  const result = []
  let randomNum = n
  while (randomNum > 0) {
    const random = Math.floor(Math.random() * arr.length)
    if (!hash[random]) {
      hash[random] = true
      result.push(arr[random])
      randomNum--
    }
  }
  return result
}
console.log(getRandomArray2([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3))
//方法三
function getTenNum(testArray, n) {
  const cloneArr = [...testArray]
  let result = []
  for (let i = 0; i < n; ++i) {
    const random = Math.floor(Math.random() * cloneArr.length)
    const cur = cloneArr[random]
    result.push(cur)
    cloneArr.splice(random, 1)
  }
  return result
}
const testArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
const resArr = getTenNum(testArray, 10)
console.log(resArr, testArray)
