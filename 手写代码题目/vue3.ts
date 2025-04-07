const bucket = new WeakMap()

let activeEffect: null | Function = null
const effect = (fn, options: { scheduler?: Function; lazy: boolean }) => {
  const effectFn = () => {
    activeEffect = effectFn
    fn()
  }

  if (!options.lazy) {
    effectFn()
  }
  return effectFn
}

const track = (target, key: string) => {
  if (!activeEffect) return
  let depsMap = bucket.get(target)
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()))
  }
  let deps = depsMap.get(key)
  if (!deps) {
    depsMap.set(key, (deps = new Set()))
  }
  deps.add(activeEffect)
}

const trigger = (target, key: string) => {
  const depsMap = bucket.get(target)
  if (!depsMap) return
  const deps = depsMap.get(key)
  deps && deps.forEach((effectFn) => effectFn())
}

const computed = (getter) => {
  let value
  let dirty = true
  const effectFn = effect(getter, {
    lazy: true,
    scheduler: () => {
      if (!dirty) {
        dirty = true
        trigger(obj, "value")
      }
    },
  })

  const obj = {
    get value() {
      if (dirty) {
        value = effectFn()
        dirty = false
      }
      track(obj, "value")
      return value
    },
  }
  return obj
}

const traverse = (value, seen = new Set()) => {
  if (typeof value !== "object" || value === null || seen.has(value)) {
    return
  }
  seen.add(value)
  for (const k in value) {
    traverse(value[k], seen)
  }
  return value
}
const watch = (source, cb) => {
  let getter
  if (typeof source === "function") {
    getter = source
  } else {
    getter = () => traverse(source)
  }

  let newValue, oldValue
  const effectFn = effect(() => getter(), {
    lazy: true,
    scheduler() {
      newValue = effectFn()
      cb(newValue, oldValue)
      oldValue = newValue
    },
  })

  oldValue = effectFn()
}

const createReactive = (obj, isShallow = false, isReadonly = false) => {
  return new Proxy(obj, {
    get(target, key: string) {
      if (key === "__v_raw") {
        return target
      }
      if (key === "__v_isReactive") {
        return true
      }
      const value = Reflect.get(target, key)
      if (!isReadonly) {
        //追踪依赖
        track(target, key)
      }

      //如果是浅相应，直接返回
      if (isShallow) {
        return value
      }

      if (typeof value === "object" && value !== null) {
        createReactive(value)
      }
      return value
    },
    set(target, key: string, value) {
      if (isReadonly) {
        return true
      }
      const oldValue = target[key]
      const res = Reflect.set(target, key, value)
      if (oldValue !== value) {
        trigger(target, key)
      }
      return res
    },
  })
}

const reactive = (data) => {
  return createReactive(data)
}

const ref = (data) => {
  const wrapper = {
    value: data,
  }
  // 创建一个响应式对象
  const reactiveObj = createReactive(wrapper, false, false)
  return reactiveObj
}

const toRef = (obj, key: string) => {
  const wrapper = {
    get value() {
      return obj[key]
    },
    set value(newValue) {
      obj[key] = newValue
    },
  }
  //标识为ref
  Object.defineProperty(wrapper, "__v_isRef", {
    value: true,
  })
  return wrapper
}

const toRefs = (obj) => {
  const ret = {}
  for (const key in obj) {
    ret[key] = toRef(obj, key)
  }
  Object.defineProperty(ret, "__v_isRef", {
    value: true,
  })
  return ret
}

//模板自动脱ref，setup语法中会将数据运行以下proxyRefs
const proxyRefs = (obj) => {
  return new Proxy(obj, {
    get(target, key: string) {
      const value = target[key]
      return value.__v_isRef ? value.value : value
    },
    set(target, key: string, value) {
      const oldValue = target[key]
      if (oldValue.__v_isRef) {
        oldValue.value = value
      }
      return Reflect.set(target, key, value)
    },
  })
}
