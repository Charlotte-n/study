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
// for (let i = 0; i < 3; i++) {
//   setTimeout(() => {
//     console.log(i)
//   }, 1000)
// }
// function print(a, b, delay) {
//   let i = 0
//   const timer = setInterval(() => {
//     console.log(a + (i % 3) * b)
//     i++
//   }, delay)

//   return {
//     clear: () => {
//       clearInterval(timer)
//     },
//   }
// }

// print(1, 2, 1000)

function compose(...fns) {
  if (!fns.length) return (...args) => args
  if (fns.length === 1) return fns[0]
  return fns.reduce(
    (a, b) =>
      (...args) =>
        a(b(...args))
  )
}
//a(b(c(args)))
//测试
const fn1 = (a) => a + 1
const fn2 = (a) => a + 2
const fn3 = (a) => a + 3
const fn = compose(fn1, fn2, fn3)
console.log(fn(1))
