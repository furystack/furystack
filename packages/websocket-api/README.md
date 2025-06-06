# websocket-api

WebSocket implementation for FuryStack.

### Usage Example

You can initialize the WebSocket package as follows:

```ts
const myInjector = new Injector().useWebsockets({
  path: '/api/sockets',
  actions: [WhoAmI],
})
```

### Implementing Your Own Actions

You can implement a WebSocket action as follows:

```ts
import { User } from '@furystack/core'
import { HttpUserContext } from '@furystack/http-api'
import { Injectable } from '@furystack/inject'
import { Data } from 'ws'
import * as ws from 'ws'
import { IWebSocketAction } from '../models/IWebSocketAction'

@Injectable({ lifetime: 'transient' })
export class WhoAmI implements WebSocketAction {
  public [Symbol.dispose]() {
    /** */
  }
  public static canExecute(data: Data): boolean {
    return data.toString() === 'whoami' || data.toString() === 'whoami /claims'
  }

  public async execute() {
    const currentUser = await this.httpUserContext.getCurrentUser()
    this.websocket.send(JSON.stringify(currentUser))
  }

  constructor(
    private httpUserContext: HttpUserContext<User>,
    private websocket: ws,
  ) {}
}
```
