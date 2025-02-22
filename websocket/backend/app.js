const WebSocket = require("ws")
const server = new WebSocket.Server({ port: 2000 })

server.on("connection", handleConnect)
function handleConnect(ws) {
  ws.on("close", handleClose)
  ws.on("error", handleError)
  ws.on("message", handleMessage)
}

function handleMessage(msg) {
  const { mode, message } = JSON.parse(msg)
  switch (mode) {
    case "MESSAGE":
      console.log(message)
      this.send({
        mode: "MESSAGE",
        message: JSON.stringify({
          mode: "MESSAGE",
          message: "heartbeat",
        }),
      })
      break
    case "HEARTBEAT":
      console.log(message)
      this.send({
        mode: "HEARTBEAT",
        message: JSON.stringify({
          mode: "MESSAGE",
          message: "heartbeat",
        }),
      })
      break
  }
}

function handleClose() {
  console.log("close")
  this.send({
    mode: "MESSAGE",
    message: "close",
  })
}
function handleError(err) {
  console.log(err)
}
