# websocket-api

WebSocket implementation for FuryStack.

### Usage Example

You can initialize the WebSocket package as follows:

```ts
import { Injector } from '@furystack/inject'
import { useWebsockets } from '@furystack/websocket-api'

const myInjector = new Injector()
await useWebsockets(myInjector, {
  path: '/api/sockets',
  actions: [WhoAmI],
})
```

### Implementing Your Own Actions

You can implement a WebSocket action as follows:

```ts
import { Injectable, Injected } from '@furystack/inject'
import { HttpUserContext } from '@furystack/rest-service'
import type { IncomingMessage } from 'http'
import type { Data, WebSocket } from 'ws'
import type { WebSocketAction } from '@furystack/websocket-api'

@Injectable({ lifetime: 'transient' })
export class WhoAmI implements WebSocketAction {
  public [Symbol.dispose]() {
    /** */
  }

  public static canExecute(options: { data: Data; request: IncomingMessage }): boolean {
    const stringifiedValue: string = options.data.toString()
    return stringifiedValue === 'whoami' || stringifiedValue === 'whoami /claims'
  }

  public async execute(options: { data: Data; request: IncomingMessage; socket: WebSocket }) {
    try {
      const currentUser = await this.httpUserContext.getCurrentUser(options.request)
      options.socket.send(JSON.stringify({ currentUser }))
    } catch (error) {
      options.socket.send(JSON.stringify({ currentUser: null }))
    }
  }

  @Injected(HttpUserContext)
  declare private readonly httpUserContext: HttpUserContext
}
```
