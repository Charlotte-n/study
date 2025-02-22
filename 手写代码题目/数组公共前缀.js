// 编写一个函数来查找字符串数组中的最长公共前缀。
// 如果不存在公共前缀，返回空字符串 ""。

// 示例 1：

// 输入：strs = ["flower","flow","flight"]
// 输出："fl"

// 示例 2：

// 输入：strs = ["dog","racecar","car"]
// 输出：""
// 解释：输入不存在公共前缀。

function getCommonPrefix(arr) {
  let result = ""
  for (let i = 0; i < arr[0].length; i++) {
    for (let j = 1; j < arr.length; j++) {
      if (arr[0][i] !== arr[j][i]) {
        return result
      }
    }
    result += arr[0][i]
  }
  return result
}
console.log(getCommonPrefix(["flower", "flow", "flight"]))
console.log(getCommonPrefix(["dog", "racecar", "car"]))
