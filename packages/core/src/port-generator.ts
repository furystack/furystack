const portGenerator = function* () {
  const initialPort = 14000 + Math.floor(Math.random() * 2000)
  let port = initialPort
  while (true) {
    yield port++
  }
}

/**
 *
 * @returns the next port number starting from 14000 to 16000
 */
export const getPort = () => portGenerator().next().value
