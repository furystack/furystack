# @furystack/cross-node-bus

Transport-agnostic publish/subscribe primitive for FuryStack. Provides the
`CrossNodeBus` interface, a default in-process adapter, and a testing
harness for multi-instance scenarios. Concrete cross-process adapters
(Redis Streams, NATS, …) ship in their own packages.

See `docs/internal/cross-node-bus-spike.md` for the full design.

## Installation

```bash
npm install @furystack/cross-node-bus
# or
yarn add @furystack/cross-node-bus
```

## Usage

The default factory resolves an `InProcessCrossNodeBus`. Single-node
deployments work without further configuration. Multi-node deployments
bind a transport adapter such as `@furystack/redis-cross-node-bus`.

```ts
import { createInjector } from '@furystack/inject'
import { CrossNodeBus } from '@furystack/cross-node-bus'

await using injector = createInjector()
const bus = injector.get(CrossNodeBus)

using sub = bus.subscribe('my-topic', (message) => {
  console.log(message.originId, message.payload)
})

await bus.publish('my-topic', { hello: 'world' })
```

### Testing harness

The `@furystack/cross-node-bus/testing` subpath ships a multi-instance
in-process harness so facade authors can write multi-node integration
tests without spinning up a broker.

```ts
import { createInProcessBusNetwork } from '@furystack/cross-node-bus/testing'

using network = createInProcessBusNetwork({ count: 2 })
const [a, b] = network.buses
```
