function asyncAdd(a, b, callback) {
  setTimeout(function () {
    callback(null, a + b)
  }, 500)
}

function promisify(a, b) {
  return new Promise((resolve, reject) => {
    asyncAdd(a, b, (err, res) => {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}
//串行异步
function serialAdd(...args) {
  return args.reduce(
    (pre, now) => pre.then((res) => promisify(res, now)),
    Promise.resolve(0)
  )
}

async function serialAdd(...args) {
  let result = 0
  for (let num of args) {
    result = await promisify(result, num)
  }
  return result
}

serialAdd(1, 2, 3, 5).then((res) => {
  console.log(res)
})
