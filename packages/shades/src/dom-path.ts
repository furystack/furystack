export const getPath = (root: Element | ShadowRoot, child: Element) => {
  if (!root.contains(child)) {
    throw Error('Child not found in root!')
  }

  let path: number[] = []
  let currentItem: Element | null = child
  while (currentItem || currentItem !== root) {
    if (!currentItem.parentElement) {
      break
    }
    const currentIndex = [...currentItem.parentElement.children].indexOf(currentItem)
    currentItem = currentItem.parentElement
    path = [currentIndex, ...path]
  }
  return path
}

export const getElementFromPath = (root: Element, path: number[]) => {
  return path.reduce((child, segment) => {
    return child.children[segment]
  }, root) as HTMLElement
}
