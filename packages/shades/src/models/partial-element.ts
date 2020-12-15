export type PartialElement<T extends { style?: CSSStyleDeclaration }> = Omit<Partial<T>, 'style'> & {
  style?: Partial<CSSStyleDeclaration>
}
