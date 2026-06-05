<!-- version-type: patch -->

# @furystack/redis-cross-node-bus

## ✨ Features

### Declares `crossNodeDelivery: true`

`RedisCrossNodeBus` now reports the new `crossNodeDelivery: true` capability (added to `CrossNodeBusCapabilities` in `@furystack/cross-node-bus`), so the task runner's boot-time capability cross-check recognizes it as a valid transport for multi-node deployments.
