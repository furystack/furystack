import type { PhysicalStore, User } from '@furystack/core'
import type { PasswordAuthenticator } from '@furystack/security'
import { UnauthenticatedError } from '@furystack/security'
import type { IncomingMessage } from 'http'
import type { DefaultSession } from '../models/default-session.js'

export const authenticateUserWithStore = async (
  authenticator: PasswordAuthenticator,
  userStore: PhysicalStore<User, 'username'>,
  userName: string,
  password: string,
): Promise<User> => {
  const result = await authenticator.checkPasswordForUser(userName, password)
  if (!result.isValid) {
    throw new UnauthenticatedError()
  }
  const users = await userStore.find({ filter: { username: { $eq: userName } }, top: 2 })
  if (users.length !== 1) {
    throw new UnauthenticatedError()
  }
  return users[0]
}

export const findSessionById = async (
  sessionStore: PhysicalStore<DefaultSession, 'sessionId'>,
  sessionId: string,
): Promise<DefaultSession | null> => {
  const sessions = await sessionStore.find({
    filter: { sessionId: { $eq: sessionId } },
    top: 2,
  })
  if (sessions.length !== 1) {
    return null
  }
  return sessions[0]
}

export const findUserByName = async (userStore: PhysicalStore<User, 'username'>, userName: string): Promise<User> => {
  const users = await userStore.find({ filter: { username: { $eq: userName } }, top: 2 })
  if (users.length !== 1) {
    throw new UnauthenticatedError()
  }
  return users[0]
}

export const extractSessionIdFromCookies = (
  request: Pick<IncomingMessage, 'headers'>,
  cookieName: string,
): string | null => {
  if (request.headers.cookie) {
    const cookies = request.headers.cookie
      .toString()
      .split(';')
      .filter((val) => val.length > 0)
      .map((val) => {
        const [name, value] = val.split('=')
        return { name: name?.trim(), value: value?.trim() }
      })
    const sessionCookie = cookies.find((c) => c.name === cookieName)
    if (sessionCookie) {
      return sessionCookie.value
    }
  }
  return null
}
