class Vue {
  constructor(instance) {
    this.$data = instance.data
    this.$el = instance.el
    //劫持数据
    Observer(this.$data)
    //显示到页面
    Compile(this.$el, this)
  }
}

function Observer(data) {
  //判断是否为对象
  if (typeof data !== "object" || data === null) {
    return
  }
  Object.keys(data).forEach((key) => {
    const dep = new Dep()
    Observer(data[key])
    let value = data[key]
    Object.defineProperty(data, key, {
      enumerable: true,
      configurable: true,
      get() {
        Dep.temp && dep.addSub(Dep.temp)
        return value
      },
      set(newVal) {
        value = newVal
        Observer(newVal)
        dep.notify()
      },
    })
  })
}

function Compile(el, vm) {
  vm.$el = document.querySelector(el)
  const fragment = document.createElement("fragment")
  let child
  while ((child = vm.$el.firstChild)) {
    fragment.appendChild(child)
  }
  //接着提取文字
  console.log(fragment.childNodes)
  compileText(fragment)
  function compileText(node) {
    const reg = /\{\{\s*(\S+)\s*}\}/
    const xxx = node.nodeValue
    if (node.nodeType === 3) {
      const res = reg.exec(node.nodeValue)
      if (res) {
        const arr = res[1].split(".")
        //获取相应的属性
        const value = arr.reduce((total, current) => total[current], vm.$data)
        node.nodeValue = xxx.replace(reg, value)
        //创建订阅者
        new Watcher(vm, res[1], () => {
          node.nodeValue = xxx.replace(reg, value)
        })
      }
      return
    }
    node.childNodes.forEach((child) => {
      compileText(child)
    })
  }

  vm.$el.appendChild(fragment)
}

//发布者
class Dep {
  constructor() {
    this.subscribe = []
  }
  addSub(watcher) {
    this.subscribe.push(watcher)
  }
  notify() {
    this.subscribe.forEach((watcher) => {
      watcher.update()
    })
  }
}

//订阅者
class Watcher {
  constructor(vm, key, cb) {
    this.vm = vm
    this.key = key
    this.cb = cb
    Dep.temp = this
    //触发读取
    key.split(".").reduce((total, current) => total[current], vm.$data)
    Dep.temp = null
  }

  update() {
    this.cb()
  }
}
