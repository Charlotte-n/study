// 控制请求并发数量

function limitRequest(urls, maxNum = 3) {
  const result = []
  const errorRes = []
  let uploaded = 0
  let index = 0

  const request = async () => {
    if (urls.length === uploaded) return
    const i = index
    const url = urls[i]
    index++
    try {
      const res = await fetch(url)
      result[i] = res
    } catch (err) {
      result[i] = err
      errorRes[i] = err
    } finally {
      uploaded++
      //判断是否完成
      if (uploaded === urls.length) {
        return {
          result,
          errorRes,
        }
      }
      request()
    }
  }
  const min = Math.min(urls.length, maxNum)
  for (let i = 0; i < min; i++) {
    request()
  }
}

function concurRequest(urls, maxNum = 3, maxRetry = 3) {
  const list = [...urls]
  const failUrl = []
  const result = []
  let activeUploaded = 0
  let retryCount = 0
  const request = async (url) => {
    try {
      const res = await fetch(url)
      result.push(res)
    } catch (err) {
      failUrl.push(url)
    } finally {
      activeUploaded--
      if (list.length) {
        request(list.shift())
      }
    }
  }

  //重试
  const retry = () => {
    while (failUrl.length > 0 && retryCount < maxRetry) {
      retryCount++
      list = [...failUrl]
      failUrl = []
      processQueue()
    }
    //如果重试次数超过最大次数，则返回错误
    if (retryCount >= maxRetry) {
      //TODO: 提示
      alert("重试次数超过最大次数")
    }
  }

  const processQueue = async () => {
    while (list.length && activeUploaded < maxNum) {
      const url = list.shift()
      activeUploaded++
      request(url)
      if (list.length === 0 && activeUploaded === 0) {
        retry()
      }
    }
  }

  processQueue()
}
