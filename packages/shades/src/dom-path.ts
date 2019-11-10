export const getPath = (root: Element | ShadowRoot | Node, child: Element) => {
  if (!root.contains(child)) {
    throw Error('Child not found in root!')
  }

  let path: number[] = []
  let currentItem: Element | null = child
  while (currentItem || currentItem !== root) {
    if (!currentItem.parentElement) {
      break
    }
    const currentIndex = [...currentItem.parentElement.childNodes].indexOf(currentItem)
    currentItem = currentItem.parentElement
    path = [currentIndex, ...path]
  }
  return path
}

export const getElementFromPath = (root: ChildNode, path: number[]) => {
  return path.reduce((child, segment) => {
    return child && child.childNodes[segment]
  }, root)
}
