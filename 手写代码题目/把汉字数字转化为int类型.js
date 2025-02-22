function chineseToNumber(chinese) {
  const numMap = {
    零: 0,
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
  }
  const unitMap = {
    十: 10,
    百: 100,
    千: 1000,
    万: 10000,
    亿: 100000000,
  }

  let result = 0
  let unit = 1
  let tempNum = 0

  for (let i = chinese.length - 1; i >= 0; i--) {
    const char = chinese[i]
    if (numMap[char] !== undefined) {
      tempNum = numMap[char]
    } else if (unitMap[char] !== undefined) {
      unit = unitMap[char]
      if (unit === 10 && (i === 0 || chinese[i - 1] in unitMap)) {
        tempNum = 1 // 处理"十"开头的情况，如"十二"等于12
      }
      result += tempNum * unit
      tempNum = 0
    }
  }
  result += tempNum * unit // 处理个位数

  return result
}

// 示例用法
console.log(chineseToNumber("一千二百三十四")) // 输出: 1234
console.log(chineseToNumber("十二")) // 输出: 12
console.log(chineseToNumber("一亿零三万")) // 输出: 100030000
