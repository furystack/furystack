/**
 * Model that represents an XML node
 */
export interface XmlNode {
  tagName: string
  attributes?: { [a: string]: string }
  children?: XmlNode[]
}

/**
 * Converts an XML Node to string
 * @param n The node to be converted
 */
// tslint:disable-next-line: no-unnecessary-type-annotation
export const xmlToString: (n: XmlNode) => string = n => {
  const attrs = n.attributes
    ? Object.keys(n.attributes)
        .map(a => `${a}="${n.attributes && n.attributes[a]}"`)
        .join(' ')
    : ''
  if (!n.children) {
    return `<${n.tagName} ${attrs} />`
  }
  return `<${n.tagName} ${attrs}>${n.children.map(x => xmlToString(x)).join('')}</${n.tagName}>`
}
