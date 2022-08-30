export const serializeValue = ([key, value]: [key: string, value: any]) => {
  if (typeof value === 'object') {
    if (value instanceof Array) {
      if (!value.some((v) => typeof v === 'object')) {
        return value.map((val) => `${key}[]=${encodeURIComponent(val)}`).join('&')
      }
    }
    return `${key}=${encodeURIComponent(JSON.stringify(value))}`
  }
  return `${key}=${encodeURIComponent(value)}`
}

export const serializeToQueryString = <T extends object>(query: T): string => {
  return Object.entries(query)
    .filter(([, value]) => value !== undefined)
    .map(serializeValue)
    .join('&')
}
