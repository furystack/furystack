const portGenerator = function* () {
  const initialPort = 14000 + Math.floor(Math.random() * 2000)
  let port = initialPort
  while (true) {
    yield port++
  }
}

const generator = portGenerator()

/**
 * Generates a unique port number for testing purposes
 * @returns the next sequential port number starting from a random base between 14000 and 16000
 */
export const getPort = (): number => generator.next().value
