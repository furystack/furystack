export const sleepAsync = (timeout = 250) =>
  new Promise<void>((resolve) =>
    setTimeout(() => {
      resolve()
    }, timeout),
  )
