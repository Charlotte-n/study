const PENDINT = 'pending'
const RESOLVED = 'fullfiled'
const REJECTED = 'rejected'
class MyPromise{
    #state = PENDINT
    #result = undefined
    onFulfilledCallbacks = []
    onRejectedCallbacks = []
    constructor(executor){
        
        const resolve = (data)=>{
            if(this.#state !== PENDINT){
                return
            }
            this.#state = RESOLVED
            this.#result = data
            this.onFulfilledCallbacks.forEach(fn=>fn())
        }

        const reject = (reason)=>{
            if(this.#state !== PENDINT)return
            this.#state = REJECTED
            this.#result = reason
            this.onRejectedCallbacks.forEach(fn=>fn())
        }

        //处理异常
        //不会捕获异步抛出的错误
        try{
            executor(resolve,reject)
        }catch(err){
            reject(err)
        }
    }
    
    //判断是不是promise对象
    #isPromiseLike(promise){
        if(promise !== null && typeof promise === 'object' || typeof promise === 'function'){
            return typeof promise.then === 'function'
        }
        return false
    }

    //放入微任务队列
    #pushToMicroTask(fn){
        if(typeof process === 'object' && typeof process.nextTick === 'function'){
            process.nextTick(fn)
        } else if(typeof MutationObserver === 'function'){
            queueMicrotask(fn)
        }else{
            setTimeout(fn,0)
        }
    }


    #resolvePromise(x,resolve){
        if(this.#isPromiseLike(x)){
            //避免多次调用
            let called = false
            x.then(data=>{
                if(called)return
                called = true
                resolve(data)
            },err=>{
                if(called)return
                called = true
                reject(err)
            })
        }else{
            resolve(x)
        }
    }

    //实现then:1.什么时候调用onFulfilled,onRejected，resolve,reject 2.返回值
    then(onFulfilled,onRejected){
        onFulfilled = typeof onFulfilled === 'function'?onFulfilled:data=>data
        onRejected = typeof onRejected === 'function'?onRejected:err=>{throw err}
        //链式调用
        return new MyPromise((resolve,reject)=>{
            //1.立即执行，2.异步执行
            //then里面的任务放在微任务队列里面，但是不是立即执行
            if(this.#state === RESOLVED){
                queueMicrotask(()=>{
                    try{
                        const x = onFulfilled(this.#result)
                        //需要保存下一次的结果
                        this.#resolvePromise(x,resolve)
                    }catch(err){
                        reject(err)
                    }
                })
               
            }else if(this.#state === REJECTED){
                queueMicrotask(()=>{
                    try{
                        const x = onRejected(this.#result)
                        this.#resolvePromise(x,reject)
                    }catch(err){
                        reject(err)
                    }
                })
             
            }else{
                //就是会出现异步调用，但是不知道什么时候状态会发生改变
                this.onFulfilledCallbacks.push(()=>{
                    const x = onFulfilled(this.#result)
                    this.#resolvePromise(x,resolve)
                })
                this.onRejectedCallbacks.push(()=>{
                    const x = onRejected(this.#result)
                    this.#resolvePromise(x,reject)
                })
            }
        })
    }

    //resolve
    static resolve(data){
        return new MyPromise((resolve,reject)=>{
            resolve(data)
        })
    }

    //reject
    static reject(reason){
        return new MyPromise((resolve,reject)=>{
            reject(reason)
        })
    }

    //catch
    catch(onRejected){
        return this.then(null,onRejected)
    }

    //finally
    static finally(callback){
        return this.then(data=>{
            return MyPromise.resolve(callback()).then(()=>data)
        },err=>{
            return MyPromise.resolve(callback()).then(()=>{throw err})
        })
    }

    //allSettled
    static allSettled(promises){
        return new MyPromise((resolve,reject)=>{
            let count = 0
            let result = []
            for(let i = 0; i < promises.length;i++){
                promises[i].then(data=>{
                    result[i] = {status:RESOLVED,value:data}
                }
                ).catch(err=>{
                    result[i] = {status:REJECTED,reason:err}
                }).finally(()=>{
                    count++
                    if(count === promises.length){
                        resolve(result)
                    }
                })
            }
        })
    }



    //race
    static race(promises){
        return new MyPromise((resolve,reject)=>{
            for(let i = 0; i < promises.length;i++){
                promises[i].then(data=>{
                    resolve(data)
                }).catch(err=>{
                    reject(err)
                })
            }
        })
    }


    //all
    static all(promises){
        return new MyPromise((resolve,reject)=>{
            if(!Array.isArray(promises)){
                reject(new TypeError('arguments must be an array'))
                return
            }
            let count = 0
            let result = []
            for(let i = 0; i < promises.length;i++){
                promises[i].then(data=>{
                    result[i] = data
                    count++
                    if(count === promises.length){
                        resolve(result)
                    }
                }).catch(err=>{
                    reject(err)
                })
            }
        })
    }
}

const promise = new MyPromise((resolve,reject)=>{
    setTimeout(()=>{
        resolve(1234)
    },1000)
})

const res = promise.then((res)=>{
    console.log(res)
    return 1
},reason=>{

})
const res1 = res.then(res=>{
    console.log(res)
    return 2
})
console.log(res)

