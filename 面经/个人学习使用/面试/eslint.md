# eslint源码
ESLint 的核心类是 Linter，它分为这样几步：

preprocess，把非 js 文本处理成 js
确定 parser（默认是 espree）
调用 parser，把源码 parse 成 SourceCode（ast）
调用 rules，对 SourceCode 进行检查，返回 linting problems
扫描出注释中的 directives，对 problems 进行过滤
postprocess，对 problems 做一次处理
基于字符串替换实现自动 fix


processor
processor是一个预处理器，用于处理特定后缀的文件，包含两个方法preprocess & postprocess。

preprocess 的参数为源码or文件名，返回一个数组，每一项为需要被校验的代码块或者文件
postprocess 主要是对校验完文件之后的问题（error,wraning）进行统一处理

AST对象
ESLint的解析规则是如果没有指定parser，默认使用expree，否则使用指定的parser，这里需要对AST有足够的了解，大家只需要知道AST对象，就是把你写的代码转换成一个可以可供分析的对象，也可以理解为JS的虚拟DOM，

ruleRules
前面聊得那些其实都是ESLint的一些工作机制，规则才是ESLint的核心，工作原理其实也就是通过保存AST节点，然后遍历所有配置中的rulename，通过rule的名称找到对应的rule对象（也就是具体的规则），具体的方法为给每一个AST节点添加监听函数，遍历nodeQueue的时候触发响应的处理函数。

runRules 会遍历 AST，然后遇到不同的 AST 会 emit 不同的事件。rule 里处理什么 AST 就会监听什么事件，这样通过事件监听的方式，就可以在遍历 AST 的过程中，执行不同的 rule 了。
遍历 AST，emit 不同的事件，触发 listener，遍历完一遍 AST，也就调用了所有的 rules，这就是 rule 的运行机制。

Fix
接下来就是修复了，主要用到SourceCodeFixer类中的applyFixes这个方法，怎么修复（fix），修复其实就是 从那个下标到哪个下标（range），替换成什么文本（text）。
通过字符串替换实现自动 fix
遍历完 AST，调用了所有的 rules，收集到了 linting problems 之后，就可以进行 fix 了。
因为多个 fix 之间的 range 也就是替换的范围可能是有重叠的，如果有重叠就放到下一次来修复，这样 while 循环最多修复 10 次，如果还有 fix 没修复就不修了。
这就是 fix 的实现原理，通过字符串替换来实现的，如果有重叠就循环来 fix。
