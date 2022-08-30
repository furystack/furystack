export type PartialElement<T> = T extends { style?: CSSStyleDeclaration }
  ? Omit<Partial<T>, 'style'> & {
      style?: Partial<CSSStyleDeclaration>
    }
  : Partial<T>
