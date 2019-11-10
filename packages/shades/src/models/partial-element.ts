export type PartialElement<T> = {
  [K in keyof T]?: T[K] extends ((...args: any[]) => any) | null | undefined ? T[K] : PartialElement<T[K]>
}
