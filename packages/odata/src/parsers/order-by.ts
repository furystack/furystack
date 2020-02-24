import { OrderType } from '../get-odata-params'

export const parseOrderBy = <T = {}>(value: string): OrderType<T> => {
  const order: OrderType<T> = {}
  value = value.trim()
  if (value.indexOf(',') !== -1) {
    const other = Object.assign({}, ...value.split(',').map(v => parseOrderBy(v)))
    return other
  }
  if (value.indexOf(' ') !== -1) {
    const [field, direction] = value.split(' ')
    order[field as keyof T] = direction.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
    return order
  }
  order[value as keyof T] = 'ASC'
  return order
}
