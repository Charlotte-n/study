// 给定一个只包括 '('，')'，'{'，'}'，'['，']' 的字符串 s ，判断字符串是否有效。

// 有效字符串需满足：
// - 左括号必须用相同类型的右括号闭合。
// - 左括号必须以正确的顺序闭合。

// 示例 1：

// 输入：s = "()"
// 输出：true

// 示例 2：

// 输入：s = "()[]{}"
// 输出：true

// 示例 3：

// 输入：s = "(]"
// 输出：false

function isValid(s) {
  if (s.length % 2 !== 0) return false
  const stack = []
  for (let i = 0; i < s.length; i++) {
    switch (s[i]) {
      case "(":
        stack.push(")")
        break
      case "{":
        stack.push("}")
        break
      case "[":
        stack.push("]")
        break
      default:
        if (stack.pop() !== s[i]) return false
    }
  }
  return stack.length === 0
}

console.log(isValid("()"))
console.log(isValid("()[]{}"))
console.log(isValid("(]"))

//嵌套的深度怎么计算

function getMaxDepth(s) {
  const stack = []
  let maxDepth = 0
  let currentDepth = 0

  for (let char of s) {
    if (char === "(" || char === "{" || char === "[") {
      currentDepth++
      maxDepth = Math.max(maxDepth, currentDepth)
      stack.push(char)
    } else {
      if (
        (char === ")" && stack[stack.length - 1] === "(") ||
        (char === "}" && stack[stack.length - 1] === "{") ||
        (char === "]" && stack[stack.length - 1] === "[")
      ) {
        stack.pop()
        currentDepth--
      }
    }
  }

  return maxDepth
}

// 测试用例
console.log(getMaxDepth("()")) // 输出: 1
console.log(getMaxDepth("()[]{}")) // 输出: 1
console.log(getMaxDepth("([])")) // 输出: 2
console.log(getMaxDepth("([{}])")) // 输出: 3
console.log(getMaxDepth("([})")) // 输出: 2
