// 把上面dom结构转成下面的JSON格式

const dom = {
  tag: "DIV",
  attributes: {
    id: "app",
  },
  children: [
    {
      tag: "SPAN",
      children: [{ tag: "A", children: [] }],
    },
    {
      tag: "SPAN",
      children: [
        { tag: "A", children: [] },
        { tag: "A", children: [] },
      ],
    },
  ],
}

function dom2json(jsonDom) {
  if (jsonDom.length === 0) return jsonDom
  const { tag, children, attributes } = jsonDom
  const dom = document.createElement(tag.toLowerCase())
  attributes &&
    Object.keys(attributes).forEach((key) =>
      dom.setAttribute(key, attributes[key])
    )
  children.forEach((child) => dom.appendChild(dom2json(child)))
  return dom
}

console.log(dom2json(dom))
