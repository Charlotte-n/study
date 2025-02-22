// 写一个函数能够实现console.log(sum(2,3))输出5，console.log(sum(2)(3))输出5

// function sum(a, b) {
//   if (b !== undefined) {
//     return a + b
//   }

//   return function (b) {
//     return a + b
//   }
// }
// console.log(sum(2, 3))
// console.log(sum(2)(3))

//
for (let i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i)
  }, 1000)
}
function print(a, b, delay) {
  let i = 0
  const timer = setInterval(() => {
    console.log(a + (i % 3) * b)
    i++
  }, delay)

  return {
    clear: () => {
      clearInterval(timer)
    },
  }
}

print(1, 2, 1000)
