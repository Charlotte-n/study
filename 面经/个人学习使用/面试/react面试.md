# fiber

## fiber 出现的意义

为了解决性能问题提出来的。

1. CPU 问题
2. IO 问题

### cpu 瓶颈

为什么会掉帧？
因为 js 可以操作 dom,但是页面也需要绘制页面进行布局，但是当 js 执行时间过于长的时候就会让页面渲染不及时，就会引起掉帧。
怎样解决的？
在浏览器每一帧的时间中，预留一些时间给 JS 线程，然后把控制权交还给渲染进程，让浏览器有剩余时间去执行样式布局和绘制。其中 React 预留的初始时间为 5ms 源码。当预留的时间不够用时，React 将线程控制权交还给浏览器使其有时间渲染 UI，React 则等待下一帧时间到来继续被中断的工作。
react 进行了时间切片。
因此要解决 CPU 瓶颈关键是要实现时间切片，时间切片的关键是将同步更新变为可中断的异步更新。

### IO 瓶颈

IO 瓶颈的话就是网络延迟，减少网络延迟对用户的感知。React 给出的答案是 将人机交互研究的结果整合到真实的 UI 中。为此 React 实现了 Suspense 功能及配套的 hook- useDeferredValue。为了实现这些特性，同样需要将同步更新变为可中断的异步更新。

fiber 出现解决了：在 React 15 及以下版本中，React 使用了一种被称为 Stack Reconciler 的调度算法，当组件的更新任务被调度后，它会一直执行到更新任务完成，期间不允许其他的任务干扰。这种方式的优点是简单粗暴，但是也有明显的缺点，因为这会导致 UI 界面被卡死，失去了流畅性和响应性。

核心：将同步更新变为了可中断的异步更新.

## fiber 是什么

React Fiber 可以理解为一个**执行单元(work unit)** ，也可以说是一种**新的数据结构**，里面保存了保存了组件的 tag、key、type、stateNode 等相关信息，用于表示组件树上的每个节点以及他们的关系。与传统的递归算法不同，**在 V16 版中 Reconciler 是基于 Fiber 节点实现的，被称为 Fiber Reconciler，支持可中断异步更新，任务支持时间切片。**我们知道 React 在数据更新时会有 diff 的操作，此时 diff 的过程是被分成一小段一小段的，Fiber 节点保存了每一阶段任务的工作进度，js 会比较一小部分虚拟 dom，然后让出主线程，交给浏览器去做其他操作，然后继续比较，如此循环往复，直至完成 diff，然后一次性更新到视图上。

## fiber 是怎样实现任务可中断的？

React 实现了类似 requestIdleCallback 的功能（React 使用 MessageChannel 实现），使得任务能实现中断执行。当一个任务执行时间过长时，会被中断机制强制中断，并存储数据，等到下一个任务执行有空闲时间后，再被调度恢复之前任务的信息并继续执行

## fiber 的工作原理

- 当组件树层级很深时，React 会一次性遍历整颗组件树执行更新操作，导致性能瓶颈。
- 当前的调度策略是不可中断的，也就是说 React 执行中间无法打断。在大型应用中，如果执行任务时间太长，会导致页面出现卡顿现象，并影响用户体验。

React Fiber 通过**分片（slicing）**和**优先级调度（priority scheduling）**来解决上述问题，从而实现了高效的组件更新和异步渲染。

1. 构建 fiber 树
   来表示 react 组件的结构和状态。与传统的递归遍历不同，React Fiber 采用链表结构对树进行分片拆分，实现递增渲染的效果。
2. 确定调度优先级
   在 Fiber 树构建完成后，React Fiber 会根据组件的更新状态和优先级，确定需要优先更新的组件，即“调度”更新。React Fiber 支持多个优先级，组件的优先级由组件的更新情况和所处的位置决定。比如页面的顶部和底部可以具有不同的优先级，用户的交互行为比自动更新的优先级更高，等等。
3. 执行调度更新
   当确定了需要调度更新的组件后，React Fiber 会将这些组件标记为“脏”（dirty），并将它们放入更新队列中，待后续处理。需要注意的是，React Fiber 并未立即执行更新操作，而是等待时间片到来时才开始执行，这样可以让 React Fiber 在执行更新时具有更高的优先级，提高了应用的响应性和性能。
4. 中断和恢复
   在执行更新时，如果需要中断当前任务，React Fiber 可以根据当前任务的优先级、执行时间和剩余时间等因素，自动中断当前任务，并将现场保存到堆栈中。当下次处理到该任务的时候，React Fiber 可以通过恢复堆栈中保存的现场信息，继续执行任务，从而实现中断和恢复的效果
5. 渲染和提交
   React Fiber 会将更新结果渲染到页面中，并设置下一次更新的时间和优先级。

- ReactDOM.render() （mount）和 setState （update）的时候开始创建更新
- Schedule（调度器）设置优先级，并将创建的更新加入任务队列，等待调度
- 在 requestIdleCallback 空闲时执行任务
- 从根节点开始遍历 FiberNode，并且构建 WorkInProgress Tree
- Reconciler（协调器） 阶段生成 EffectList（对其打标签，进行 Diff 对比）
- Renderer（渲染器） 根据 EffectList 更新 DOM

## 为什么不用 setTimeout，而用 MessageChannel

A：setTimeout 会有延迟，因为 setTimeout 默认有 4 毫秒的延迟。使用 MessageChannel 可以实现，它工作原理和 setTimeout 类似，延迟为 0~1 ms

## Fiber 是通过什么实现时间切片的

A：requestIdleCallback 有兼容性问题，不是所有浏览器都支持，所以 React 团队用 MessageChannel 模拟 requestIdleCallback

## fiber 的数据结构

this.tag = tag; // Fiber 组件类型 Function/Class....
this.key = key; // key 属性，diff 时需要
this.elementType = null; // 大部分情况同 type，某些情况不同，比如 FunctionComponent 使用 React.memo 包裹
this.type = null; // 对于 FunctionComponent，指函数本身，对于 ClassComponent，指 class，对于 HostComponent，指 DOM 节点的 tagName
this.stateNode = null; // Fiber 对应的真实 DOM 节点

/**
链接 Fiber 节点形成 Fiber 树所需属性
**/
this.return = null; // 指向父级 Fbier 节点
this.child = null; // 指向子 Fiber 节点
this.sibling = null; // 指向兄弟 Fiber 节点
this.index = 0; // 下标
this.ref = null;
this.refCleanup = null;

## ReactElement, Fiber, DOM 三者的关系

A：我们用 JSX 写出的代码，会被 React 转换成 ReactElement 对象

Fiber Tree 是通过 ReactElement 生成的，它就是 虚拟 DOM，

Fiber Tree 是 DOM 树 的数据结构，Fiber Tree 驱动 DOM Tree

## React17 之前 jsx 文件为什么要声明 import React from 'react'，之后为什么不需要了

A：React 17 之前：JSX 编译为 React.createElement 调用，因此需要导入 React

React 17 及之后：变成了 jsx.createElement，因此不再需要显示导入 React

其原因是 React 和 babel 团队合作，单独为 React 团队做了个 react/jsx-runtime

## react15 的架构

- Reconciler（协调器）
- Renderer（渲染器）

Reconciler 负责找出变化的组件，属于共享代码

Renderer 负责将变化的组件渲染到页面上，不同的平台有不同的渲染器

React 15 的 Reconciler （协调器）称之为 Stack reconciler，它的特点是当主动或被动触发更新组件（如改变 props、setState 操作）时，会递归执行更新。当组件层级很深，递归更新时间超过 16ms，就会呈现卡顿现象

## react16 架构

- Scheduler（调度器）
  所以只要我们设置一种机制，将一个耗时长的任务分成很多小任务，按照优先级顺序依次执行，当计算时间超过 16ms，就交由 GUI 绘制，绘制一会儿再由渲染线程接管，执行 JS。React 的 Scheduler（调度器）再按照优先级分配，看有没有紧急任务，如果没有就继续更新，有的话就执行紧急任务，完成紧急任务后就按照优先级继续完成剩余任务。当执行时间再到 16ms 时，再交给 GUI 绘制，如此反复，就能瞒过肉眼，感觉运行流畅

  React 中调度器的不同优先级极其排序

Immediate：最高优先级，会马上执行的不能中断
UserBlocking：一般用户交互结果，需要及时反馈
Normal：普通等级，比如网络请求等不需要用户立即感知的
Low：低优先级，这种可以延后，最后要执行
Idle：最低优先级，可以被无限延迟，比如 console

- Reconciler（协调器）
  在讲 React 15 的 Reconciler 时，我们讲到它是递归处理虚拟 DOM，React 16 中的 Reconciler 则从递归变成了可以中断的循环过程。每次循环都会调用 shouldYield 判断当前是否有剩余时间。在 React 16 中，Reconciler 与 Renderer 不再是交替工作。当 Scheduler 将任务交给 Reconciler 后，Reconciler 会为变化的虚拟 DOM 打上增/删/更新的标签。
- Renderer（渲染器）
  就是将 Reconciler 打上标签的虚拟 DOM 对象（即 FiberNode）执行成 DOM（Virtual DOM 变 视图）

简单来说，React 16 的 Fiber 架构就是先通过调度器将高优先级的任务 push 到协调器中的就绪任务队列中，协调器对其打标签，找出需要变化的组件，最后由渲染器将变化的组件渲染到页面

## react16 和 react15 架构区别

React 16 多了 Scheduler（调度器），分配优先级；React15 没有 Scheduler，不能分配优先级

React 16 中的 Reconciler（协调器）采用 Fiber 架构，可以进行异步可中断更新；React 15 的 Reconciler 为 Stack reconciler（堆栈协调器），状态更新时，会进行递归更新，同步且不可中断

# Virtual Dom
