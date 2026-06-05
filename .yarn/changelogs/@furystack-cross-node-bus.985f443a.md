<!-- version-type: patch -->

# @furystack/cross-node-bus

## ✨ Features

### `crossNodeDelivery` capability flag

`CrossNodeBusCapabilities` gains a `crossNodeDelivery: boolean` flag declaring whether an adapter actually delivers messages across OS processes / network nodes. `InProcessCrossNodeBus` reports `crossNodeDelivery: false`. This lets consumers (notably `@furystack/task-runner`) refuse multi-node deployments that are wired to an in-process bus at boot instead of silently dropping cross-node progress events.
