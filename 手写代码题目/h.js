//红黄绿灯循环，红灯1秒，黄灯3秒，绿灯2秒，循环
function redLight() {
  console.log("红灯")
}
function yellowLight() {
  console.log("黄灯")
}
function greenLight() {
  console.log("绿灯")
}

function light(fn, delay, message) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      fn()
      resolve(message)
    }, delay)
  })
}
//循环
function trafficLight() {
  light(redLight, 1000)
    .then(() => light(yellowLight, 3000))
    .then(() => light(greenLight, 2000))
    .then(() => trafficLight())
}

function* trafficLight2() {
  yield light(redLight, 1000, "红灯")
  yield light(yellowLight, 3000, "黄灯")
  yield light(greenLight, 2000, "绿灯")
  yield* trafficLight2()
}

//循环这个生成器
function asyncGenerator(gen) {
  return function () {
    const g = gen()
    return new Promise((resolve, reject) => {
      function next(key, arg) {
        let res = g[key](arg)
        const { value, done } = res
        if (done) {
          resolve(value)
        } else {
          // 如果value是promise，则递归调用next
          Promise.resolve(value).then((data) => next("next", data))
        }
      }
      next("next")
    })
  }
}
const gen2 = asyncGenerator(trafficLight2)
