export const tryDecodeQueryParam = (queryParam: any) => {
  try {
    return JSON.parse(decodeURIComponent((queryParam as any).toString()))
  } catch {
    try {
      return JSON.parse(queryParam.toString())
    } catch {
      try {
        return decodeURIComponent(queryParam.toString())
      } catch {
        return queryParam
      }
    }
  }
}

export const deserializeQueryString = (fullQueryString: string) => {
  const queryString = fullQueryString?.replace?.('?', '') // trim starting ?

  if (!queryString) {
    return {}
  }

  const entries = queryString
    .split('&')
    .map((value) => value.split('='))
    .filter(([key, value]) => key?.length && value?.length) // filter out empty keys

  const dedupedValues = entries
    .reduce((prev, current) => {
      const currentKey = current[0]
      const currentValue = tryDecodeQueryParam(current[1])
      const existing = prev.find(([key]) => key === currentKey)
      if (existing) {
        existing[1] instanceof Array ? existing[1].push(currentValue) : (existing[1] = currentValue)
        return [...prev]
      }
      const newValue = [currentKey, currentKey.includes('[]') ? [currentValue] : currentValue] as [
        string,
        string | string[],
      ]
      return [...prev, newValue]
    }, [] as Array<[string, string | string[]]>)
    .map(([key, value]) => [key.replace('[]', ''), value])

  return Object.fromEntries(dedupedValues)
}
