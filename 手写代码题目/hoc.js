function fn(n) {
  let count = 1
  const step = () => {
    if (count === n + 1) {
      return
    }
    new Promise((resolve) => {
      setTimeout(() => {
        console.log(count)
        count++
        resolve()
      }, count * 1000)
    }).then(step)
  }
  step()
}

fn(10)
