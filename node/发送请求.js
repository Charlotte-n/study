//http
const http = require("http")

http
  .get("http://example.com", (res) => {
    let data = ""

    res.on("data", (chunk) => {
      data += chunk
    })

    res.on("end", () => {
      console.log(data)
    })
  })
  .on("error", (err) => {
    console.error(`Error: ${err.message}`)
  })

//post
const http = require("http")

const postData = JSON.stringify({
  key: "value",
})

const options = {
  hostname: "example.com",
  port: 80,
  path: "/path",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(postData),
  },
}

const req = http.request(options, (res) => {
  let data = ""

  res.on("data", (chunk) => {
    data += chunk
  })

  res.on("end", () => {
    console.log(data)
  })
})

req.on("error", (err) => {
  console.error(`Error: ${err.message}`)
})

req.write(postData)
req.end()
//axios
//get
const axios = require("axios")

axios
  .get("http://example.com")
  .then((response) => {
    console.log(response.data)
  })
  .catch((error) => {
    console.error(`Error: ${error.message}`)
  })

// post
axios
  .post("http://example.com/path", {
    key: "value",
  })
  .then((response) => {
    console.log(response.data)
  })
  .catch((error) => {
    console.error(`Error: ${error.message}`)
  })
