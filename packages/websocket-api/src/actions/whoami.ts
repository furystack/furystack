import { HttpUserContext } from '@furystack/rest-service'
import type { WebSocketAction } from '../models/websocket-action.js'

/**
 * Built-in action that responds to `whoami` and `whoami /claims` messages
 * with the current user resolved from the per-connection `HttpUserContext`.
 * Replies with `{ currentUser: null }` if resolution fails (e.g. unauthenticated).
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
