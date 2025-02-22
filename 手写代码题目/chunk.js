function chunk(arr, size) {
  const newArr = []
  for (let i = 0; i < arr.length; i += size) {
    console.log(arr.slice(i, i + size))
    newArr.push(arr.slice(i, i + size))
  }
  return newArr
}

console.log(chunk([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 3))
