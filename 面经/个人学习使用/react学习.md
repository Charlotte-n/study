# Redux

三个步骤完成了一个完整的 Redux 的逻辑：

1. 先创建 Store；
2. 再利用 Action 和 Reducer 修改 Store；
3. 最后利用 subscribe 监听 Store 的变化。

引入 Facebook 提供的 `react-redux` 这样一个工具库，工具库的作用就是建立一个桥梁，让 React 和 Redux 实现互通。

主要是两点：

1. React 组件能够在依赖的 Store 的数据发生变化时，重新 Render；
2. 在 React 组件中，能够在某些时机去 dispatch 一个 action，从而触发 Store 的更新。

Hooks 的本质就是**提供了让 React 组件能够绑定到某个可变的数据源的能力**。在这里，当 Hooks 用到 Redux 时可变的对象就是 Store，而 useSelector 则让一个组件能够在 Store 的某些数据发生变化时重新 render。

我在这里仍然以官方给的计数器例子为例，来给你讲解如何在 React 中使用 Redux：

```js
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

export function Counter() {
  // 从 state 中获取当前的计数值
  const count = useSelector(state => state.value)

  // 获得当前 store 的 dispatch 方法
  const dispatch = useDispatch()

  // 在按钮的 click 时间中去分发 action 来修改 store
  return (
    

       dispatch({ type: 'counter/incremented' })}
      >+
      {count}
       dispatch({ type: 'counter/decremented' })}
      >-
    

  )
}
```

![image-20240901102459672](C:\Users\mm\AppData\Roaming\Typora\typora-user-images\image-20240901102459672.png)

## 处理异步逻辑

通过react-thunk来进行处理异步逻辑。

解决方案三种:

1. redux-thunk
2. redux-promise
3. redux-saga

> 假设我们希望在另外一个组件中也能发送同样的请求，就不得不将这段代码重新实现一遍。因此，Redux 中提供了 middleware 这样一个机制，让我们可以巧妙地实现所谓异步 Action 的概念。简单来说，middleware 可以让你提供一个拦截器在 reducer 处理 action 之前被调用。在这个拦截器中，你可以自由处理获得的 action。无论是把这个 action 直接传递到 reducer，或者构建新的 action 发送到 reducer，都是可以的。从下面这张图可以看到，Middleware 正是在 Action 真正到达 Reducer 之前提供的一个额外处理 Action 的机会

![image-20240901105527507](C:\Users\mm\AppData\Roaming\Typora\typora-user-images\image-20240901105527507.png)

相较同步数据流，异步数据流有一个异步请求的操作，等异步请求有了结果才会触发`action`进入到`reducer`，修改`store`中的`state`。

![image-20240901103907535](C:\Users\mm\AppData\Roaming\Typora\typora-user-images\image-20240901103907535.png)

使用

```js
import { createStore, applyMiddleware } from 'redux'
import thunkMiddleware from 'redux-thunk'
import rootReducer from './reducer'

const composedEnhancer = applyMiddleware(thunkMiddleware)
const store = createStore(rootReducer, composedEnhancer)
//那么在我们dispatch action 时就可以 dispatch 一个函数用于来发送请求，通常，我们会写成如下的结构：

function fetchData() {
  return dispatch => {
    dispatch({ type: 'FETCH_DATA_BEGIN' });
    fetch('/some-url').then(res => {
      dispatch({ type: 'FETCH_DATA_SUCCESS', data: res });
    }).catch(err => {
      dispatch({ type: 'FETCH_DATA_FAILURE', error: err });
    })
  }
}
//那么在我们dispatch action 时就可以 dispatch 一个函数用于来发送请求，通常，我们会写成如下的结构：

import fetchData from './fetchData';

function DataList() {
  const dispatch = useDispatch();
  // dispatch 了一个函数由 redux-thunk 中间件去执行,执行完之后再走reducer逻辑
  dispatch(fetchData());
}
```

redux-promise

```js
import { getTodoByIdType } from "../types";

// 请求API
const getTodoById = async (payload) => {
  const res = await fetch(
    `https://jsonplaceholder.typicode.com/todos/${payload}`
  );
  const response = await res.json();
  return response;
};

// 直接将异步请求设置成payload
// 当异步有了结果会自动触发该action，然后进入到reducer更新state
export const getTodoByIdPromiseAction = (payload) => {
  return {
    type: getTodoByIdType,
    payload: getTodoById(payload),
  };
};
将异步请求放到payload里面，当异步请求结束后就进行更新state
```

1. `redux-thunk`使用简单，直接在`action`里面进行异步操作，虽然简单但是在`action`里面写异步逻辑感觉有点混乱。

2. `redux-promise`隐藏了异步操作的具体细节，并且只需要一个`action`就能完成异步操作，相对`redux-thunk`来说更加简单。
3. `redux-saga`，把异步操作单独分离出来放在`saga`文件中。当我们提交普通`action`的时候，如果匹配到了`saga`文件中的监听器就会被拦截下来，然后调用`saga`里配置的方法进行异步操作。如果没匹配上就走提交普通`action`的逻辑。总体来说逻辑较为清晰，但是使用成本增加。

# 复杂状态处理：如何保证状态一致性？

## 保证状态最小化

不要对state来进行滥用，**某些数据如果能从已有的 State 中计算得到，那么我们就应该始终在用的时候去计算，而不要把计算的结果存到某个 State 中。**

```js
import React, { useState, useMemo } from "react";

function FilterList({ data }) {
  const [searchKey, setSearchKey] = useState("");
  
  // 每当 searchKey 或者 data 变化的时候，重新计算最终结果
  const filtered = useMemo(() => {
    return data.filter((item) =>
      item.title.toLowerCase().includes(searchKey.toLowerCase())
    );
  }, [searchKey, data]);

  return (
    Movies
{searchKey}
 setSearchKey(evt.target.value)}
      />

       {filtered.map((item) => (
          
{item.title}

        ))}

  );
}
```

注意：所以我们在定义一个新的状态之前，都要再三拷问自己：**这个状态是必须的吗？是否能通过计算得到呢？**在得到肯定的回答后，我们再去定义新的状态，就能避免大部分多余的状态定义问题了，也就能在简化状态管理的同时，保证状态的一致性。

## 原则二：避免中间状态，确保唯一数据源

在有的场景下，特别是原始状态数据来自某个外部数据源，而非 state 或者 props 的时候，冗余状态就没那么明显。这时候你就需要准确定位状态的数据源究竟是什么，并且在开发中确保它始终是唯一的数据源，以此避免定义中间状态。

```js
// getQuery 函数用户获取 URL 的查询字符串
import getQuery from './getQuery';
// history 工具可以用于改变浏览器地址
import history from './history';

function SearchBox({ data }) {
  // 定义关键字这个状态，用 URL 上的查询参数作为初始值
  const [searchKey, setSearchKey] = useState(getQuery('key'));
  // 处理用户输入的关键字
  const handleSearchChange = useCallback(evt => {
    const key = evt.target.value;
    // 设置当前的查询关键状态
    setSearchKey(key);
    // 改变 URL 的查询参数
    history.push(`/movie-list?key=${key}`);
  })
  // ....
  return (     
{searchKey}

      {/* 其它渲染逻辑*/}
  );
}
```

**我们要有更加完善的机制，让在 URL 不管因为什么原因而发生变化的时候，都能同步查询参数到 searchKey 这个 State**。

```js
import React, { useCallback, useMemo } from "react";
import { useSearchParam } from "react-use";

function SearchBox({ data }) {
  // 使用 useSearchParam 这个 Hook 用于监听查询参数变化
  const searchKey = useSearchParam("key") || "";
  const filtered = useMemo(() => {
    return data.filter((item) =>
      item.title.toLowerCase().includes(searchKey.toLowerCase())
    );
  }, [searchKey, data]);

  const handleSearch = useCallback((evt) => {
    // 当用户输入时，直接改变 URL
    window.history.pushState(
      {},
      "",
      `${window.location.pathname}?key=${evt.target.value}`
    );
  }, []);
  return (
Movies (Search key from URL)   
{searchKey}
        {filtered.map((item) => (
          
{item.title}

        ))}
  );
}
```

我们是直接将 URL 作为唯一的数据来源，那么状态的读取和修改都是对 URL 直接进行操作，而不是通过一个中间的状态。这样就简化了状态的管理，保证了状态的一致性。

## 实战演练：创建自定义受控组件

```js
import React, { useState, useCallback } from "react";

function PriceInput({
  // 定义默认的 value 的数据结构
  value = { amount: 0, currency: "rmb" },
  // 默认不处理 onChange 事件
  onChange = () => {}
}) {
  // 定义一个事件处理函数统一处理 amount 或者 currency 变化的场景
  const handleChange = useCallback(
    (deltaValue) => {
      // 直接修改外部的 value 值，而不是定义内部 state
      onChange({
        ...value,
        ...deltaValue
      });
    },
    [value, onChange]
  );
  return (
    

      {/* 输入价格的数量 */}
      
{value.amount}
 handleChange({ amount: evt.target.value })}
      />
      {/* 选择货币种类*/}
      
RMB

    

  );
}
```

1. 避免多余的状态：我们不需要在 PriceInput 这个自定义组件内部，去定义状态用于保存的 amount 或者 currency。
2. 找到准确的唯一数据源：这里内部两个基础组件的值，其准确且唯一的来源就是 value 属性，而不是其它的任何中间状态。

# 问题

1. 函数体也是每次render都会执行，那么，需要每次都会render执行的语句是放在 无依赖的useEffect中呢，还是直接放在函数体中比较好呢？

讲解：这两种情况的语义是不一样的。**useEffect 代表副作用，是在函数render 完后执行。而函数体中的代码，是直接影响当次 render 的结果。**

所以在写代码的时候，我们一定要理解每个 API 的语义，副作用一定是和当前 render 的结果没关系的，而只是 render 完之后做的一些额外的事情。

2. 请问在性能方面是否后者优于前者？写法如下：

   ```
   const handleIncrement = useCallback(() => setCount(count + 1), [count]);
   const handleIncrement = useCallback(() => setCount(q => q + 1), []);
   ```

确实后者是更好的写法，因为 handleIncrement 不会每次在 count 变化时都使用新的。从而接收这个函数的组件 props 就认为没有变化，避免可能的性能问题。

但是有时候如果 DOM 结构很简单，其实怎么写都没什么影响。但两种代码实际上都是每次创建函数的，只是第二种写法后面创建的函数是被 useCallback 忽略的。

所以这里也看到了 setState 这个 API 的另外一种用法，就是可以接收一个函数作为参数：setSomeState(previousState => {})。这样在这个函数中通过参数就可以直接获取上一次的 state 的值了，而无需将其作为一个依赖项。这样做可以减少一些不必要的回调函数的创建。

# hooks

## useState

让页面更新，让组件更新。

为什么异步更新：

1. 性能优化：React 可以在一次渲染过程中合并和批处理多个状态更新，减少不必要的重复计算和渲染操作，提高性能。

2. 可预测性：异步更新可以确保在某个时间点只执行一次渲染，使得渲染结果更加可预测和稳定。

3. 避免死循环：如果 `setState` 是同步的，那么在更新状态时可能会导致无限循环。因为每次更新状态会触发重新渲染，而重新渲染又可能触发新一轮的状态更新，形成死循环。


特点：

1. 异步更新，无法直接拿到最新的state值。使用函数state更新不会被合并，如果是值的话能合并
2. state不可变数据。
3. 使用immer来让state不可变

![10603317253683442](C:\Users\mm\Downloads/10603317253683442.png)

![28361117253684572](C:\Users\mm\Downloads/28361117253684572.png)

![35208317253685052](C:\Users\mm\Downloads/35208317253685052.png)

## useEffect

开发模式会有两次

就是创建、销毁、创建的过程

生产模式就一次。

## useRef

1. 获取原生dom
2. 可以传入普通的变量，不会触发render

## useMemo

1. 函数组件，每次state更新都会重新执行函数。
2. useMemo可以缓存数据，不用每次执行函数都重新生成。
3. 可以用于计算量较大的场景，缓存提高性能。

![image-20240903230155330](C:\Users\mm\AppData\Roaming\Typora\typora-user-images\image-20240903230155330.png)

## useCallback

缓存函数

## 第三方hooks

1. ahooks
2. react-use

效率高

## react面试题--闭包陷阱

![image-20240903232624129](C:\Users\mm\AppData\Roaming\Typora\typora-user-images\image-20240903232624129.png)

# css样式

## 内联

内联style代码多，性能差，拓展性不好

## 引入CSS文件

1. 使用css文件
2. jsx使用className
3. 可以通过库(className)作为条件

外联css文件可复用代码，可单独缓存文件

## CSS Module

一个文件一个css，但是容易造成命名冲突。

有css 的b（block）e（element）m（modifier）

现在可以通过css module解决

![image-20240904000257653](C:\Users\mm\AppData\Roaming\Typora\typora-user-images\image-20240904000257653.png)

![image-20240904000857219](C:\Users\mm\AppData\Roaming\Typora\typora-user-images\image-20240904000857219.png)

## CSS-in-JS

## 原子化CSS

tailwindcss



