const PORTS_PER_WORKER = 200
const BASE_PORT = 14000

const portGenerator = function* () {
  const workerId = parseInt(process.env.VITEST_POOL_ID ?? '0', 10)
  let port = BASE_PORT + workerId * PORTS_PER_WORKER
  while (true) {
    yield port++
  }
}

const generator = portGenerator()

/**
 * Generates a unique port number for testing purposes.
 * Each Vitest worker gets a dedicated range of {@link PORTS_PER_WORKER} ports
 * based on its VITEST_POOL_ID to avoid collisions between parallel workers.
 * @returns the next sequential port number
 */
export const getPort = (): number => generator.next().value
