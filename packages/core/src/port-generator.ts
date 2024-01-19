const portGenerator = function* () {
  const initialPort = 16000
  let port = initialPort
  while (true) {
    yield port++
  }
}

/**
 *
 * @returns the next port number starting from 16000
 */
export const getPort = () => portGenerator().next().value
