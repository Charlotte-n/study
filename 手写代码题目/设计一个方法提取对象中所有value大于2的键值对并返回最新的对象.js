//实现一个方法，并发请求接口数量

async function requestLimit(urls, maxNum, maxRetry) {
  return new Promise((resolve, reject) => {
    const list = [...urls]
    const result = []
    const failUrl = []
    let activeUploaded = 0

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
        if (list.length === 0 && activeUploaded === 0 && failUrl.length === 0) {
          resolve(result)
        }
      }
    }

    const retry = async () => {
      list = [...failUrl]
      failUrl = []
      await processQueue()
    }

    const processQueue = async () => {
      while (list.length && activeUploaded < maxNum) {
        activeUploaded++
        request(list.shift())
      }
      if (list.length === 0 && activeUploaded === 0 && failUrl.length) {
        for (let i = 0; i < maxRetry; i++) {
          await retry()
        }
      }
    }
    processQueue()
  })
}

requestLimit(
  ["https://www.baidu.com", "https://www.baidu.com", "https://www.baidu.com"],
  2,
  2
)

function get100Request(delay) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(delay)
    }, delay)
  })
}
