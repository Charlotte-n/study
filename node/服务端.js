const http = require("http")

const server = http.createServer((req, res) => {
  res.statusCode = 200
  res.setHeader("Content-type", "text/plain")
  res.end("hello world")
})

server.listen(3000, () => {
  console.log("server is running on port 3000")
})

server.on("error", (err) => {
  console.error(`Server encountered an error: ${err.message}`)
})

//express
const express = require("express")
const app = express()
const PORT = 3000

app.get("/", (req, res) => {
  res.send("Hello, World!")
})

app.get("/about", (req, res) => {
  res.send("About Page")
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`)
})

app.on("error", (err) => {
  console.error(`Express encountered an error: ${err.message}`)
})

//开启集群
const cluster = require("cluster")
const http = require("http")
const numCPUs = require("os").cpus().length

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork()
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`)
  })
} else {
  // Worker进程共享同一个TCP连接
  const server = http.createServer((req, res) => {
    res.statusCode = 200
    res.setHeader("Content-Type", "text/plain")
    res.end("Hello, World!\n")
  })

  server.listen(3000)
}
