import { HttpUserContext } from '@furystack/rest-service'
import type { WebSocketAction } from '../models/websocket-action.js'

/**
 * Example action that replies with the current user resolved from the
 * per-connection `HttpUserContext`. Handles `whoami` and `whoami /claims`.
 */
export const WhoAmI: WebSocketAction = {
  canExecute: ({ data }) => {
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const stringifiedValue: string = data.toString()
    return stringifiedValue === 'whoami' || stringifiedValue === 'whoami /claims'
  },
  execute: async ({ request, socket, injector }) => {
    const httpUserContext = injector.get(HttpUserContext)
    try {
      const currentUser = await httpUserContext.getCurrentUser(request)
      socket.send(JSON.stringify({ currentUser }))
    } catch {
      socket.send(JSON.stringify({ currentUser: null }))
    }
  },
}
