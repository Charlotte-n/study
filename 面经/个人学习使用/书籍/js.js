var a = 1
function printA() {
  console.log(this.a)
}
var obj = {
  a: 2,
  foo: printA,
  bar: function () {
    printA()
  },
}

obj.foo() // 2
obj.bar() // 1
var foo = obj.foo
foo() // 1

// 我们知道，匿名函数的this是指向全局对象的，所以this指向window，会打印出3；
