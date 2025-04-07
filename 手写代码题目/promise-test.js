const PENDING = "pending"
const FULFILLED = "fulfilled"
const REJECTED = "rejected"
class MyPromise {
  #state = PENDING
  #result = null
  onFullFilledCallbacks = []
  onRejectedCallbacks = []
  constructor(executor) {
    //核心目的
    // 确保异步执行：将回调函数放入微任务队列，避免阻塞主线程
    // 符合规范：Promise 的 then/catch/finally 回调必须是异步的
    const resolve = (data) => {
      if (this.#state !== PENDING) {
        return
      }
      this.#state = FULFILLED
      this.#result = data
      this.onFullFilledCallbacks((fn) => this.#pushMicroTask(fn))
    }

    const reject = (reason) => {
      if (this.#state !== PENDING) {
        return
      }
      this.#state = REJECTED
      this.#result = reason
      this.onRejectedCallbacks.forEach((fn) => this.#pushMicroTask(fn))
    }

    try {
      executor(resolve, reject)
    } catch (err) {
      reject(err)
    }
  }

  //加入到微任务中
  #pushMicroTask(fn) {
    if (typeof process === "object" && typeof process.nextTick === "function") {
      process.nextTick(fn)
    } else if (typeof MutationObserver === "function") {
      MutationObserver(fn)
    } else {
      setTimeout(fn, 0)
    }
  }

  //判断是不是promise
  #isPromiseLike(promise) {
    if (
      (promise !== null && typeof promise === "object") ||
      typeof promise === "function"
    ) {
      return typeof promise.then === "function"
    }
    return false
  }

  //实现resolvePromise方法
  #resolvePromise(value, resolve) {
    if (this.#isPromiseLike(value)) {
      let called = false
      value.then(
        (data) => {
          if (called) return
          called = true
          this.#resolvePromise(data, resolve)
        },
        (err) => {}
      )
    } else {
      resolve(value)
    }
  }

  //实现then方法
  then(onFulfilled, onRejected) {
    onFulfilled =
      typeof onFulfilled === "function" ? onFulfilled : (data) => data
    onRejected =
      typeof onRejected === "function"
        ? onRejected
        : (err) => {
            throw err
          }

    return new MyPromise((resolve, reject) => {
      if (this.#state === FULFILLED) {
        this.#pushMicroTask(() => {
          try {
            const x = onFulfilled(this.#result)
            this.#resolvePromise(x, resolve)
          } catch (err) {
            reject(err)
          }
        })
      } else if (this.#state === REJECTED) {
        this.#pushMicroTask(() => {
          try {
            const x = onRejected(this.#result)
            this.#resolvePromise(x, reject)
          } catch (err) {
            reject(err)
          }
        })
      } else {
        this.onFullFilledCallbacks.push(() => {
          try {
            const x = onFulfilled(this.#result)
            this.#resolvePromise(x, resolve)
          } catch (err) {
            reject(err)
          }
        })

        this.onRejectedCallbacks.push(() => {
          try {
            const x = onRejected(this.#result)
            this.#resolvePromise(x, reject)
          } catch (err) {
            reject(err)
          }
        })
      }
    })
  }

  //实现catch方法
  catch(onRejected) {
    this.then(null, onRejected)
  }

  //finally
  finally(callback) {
    return this.then(
      (data) => {
        return MyPromise.resolve(callback()).then(() => data)
      },
      (reason) => {
        return MyPromise.resolve(callback()).then(() => {
          throw reason
        })
      }
    )
  }
  static resolve(value) {
    return new MyPromise((resolve, reject) => {
      resolve(value)
    })
  }
  static reject(reason) {
    return new MyPromise((resolve, reject) => {
      reject(reason)
    })
  }

  static allSettled(promises) {
    return new MyPromise((resolve, reject) => {
      let count = 0
      let result = []
      for (let i = 0; i < promises.length; i++) {
        promises[i]
          .then((data) => {
            result[i] = { status: RESOLVED, value: data }
          })
          .catch((err) => {
            result[i] = { status: REJECTED, reason: err }
          })
          .finally(() => {
            count++
            if (count === promises.length) {
              resolve(result)
            }
          })
      }
    })
  }

  //实现race方法
  static race(promises) {
    return new MyPromise((resolve, reject) => {
      for (let i = 0; i < promises.length; i++) {
        promises[i].then(resolve).catch(reject)
      }
    })
  }

  //实现all方法
  static all(promises) {
    return new MyPromise((resolve, reject) => {
      let count = 0
      let result = []
      for (let i = 0; i < promises.length; i++) {
        MyPromise.resolve(promises[i])
          .then((data) => {
            count++
            result[i] = data
            if (count === promises.length) {
              resolve(result)
            }
          })
          .catch((err) => {
            reject(err)
          })
      }
    })
  }
}
