const { spawn } = require("child_process")
const ls = spawn("ls", ["-lh", "/usr"])

ls.stdout.on("data", (data) => {
  console.log(`stdout: ${data}`)
})

ls.stderr.on("data", (data) => {
  console.error(`stderr: ${data}`)
})

ls.on("close", (code) => {
  console.log(`child process exited with code ${code}`)
})

//执行命令
const { exec } = require("child_process")
exec("ls -lh /usr", (error, stdout, stderr) => {
  if (error) {
    console.error(`exec error: ${error}`)
    return
  }
  console.log(`stdout: ${stdout}`)
  console.error(`stderr: ${stderr}`)
})

//创建一个名为child.js的子进程，并监听消息
const { fork } = require("child_process")
const child = fork("child.js")

child.on("message", (msg) => {
  console.log(`Message from child: ${msg}`)
})

child.send({ hello: "world" })

// 2）子进程的特点：

// 独立性：子进程和其父进程在内存空间和执行上下文上都是独立的，可以各自执行任务，不互相干扰。
// 并行性：可以利用多核 CPU 的优势，通过多进程提高性能。
// 通讯：Node.js 提供了进程间通讯（IPC）端口来允许父子进程之间传递消息。
// 3）应用场景：

// 高计算任务：避免阻塞主线程，如视频处理、数据分析等需要大量 CPU 资源的操作。
// 隔离：在独立的子进程中运行不可信任或复杂的代码，提高系统健壮性。
// 并行任务处理：多个子进程同时执行任务，提高吞吐量，如批量下载文件、并行查询数据库等。
