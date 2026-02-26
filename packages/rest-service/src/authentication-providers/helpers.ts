import type { User } from '@furystack/core'
import type { Injector } from '@furystack/inject'
import type { PasswordAuthenticator } from '@furystack/security'
import { UnauthenticatedError } from '@furystack/security'
import type { DataSet } from '@furystack/repository'
import type { IncomingMessage } from 'http'
import type { DefaultSession } from '../models/default-session.js'

export const authenticateUserWithDataSet = async (
  authenticator: PasswordAuthenticator,
  userDataSet: DataSet<User, 'username'>,
  injector: Injector,
  userName: string,
  password: string,
): Promise<User> => {
  const result = await authenticator.checkPasswordForUser(userName, password)
  if (!result.isValid) {
    throw new UnauthenticatedError()
  }
  const users = await userDataSet.find(injector, { filter: { username: { $eq: userName } }, top: 2 })
  if (users.length !== 1) {
    throw new UnauthenticatedError()
  }
  return users[0]
}

export const findSessionById = async (
  sessionDataSet: DataSet<DefaultSession, 'sessionId'>,
  injector: Injector,
  sessionId: string,
): Promise<DefaultSession | null> => {
  const sessions = await sessionDataSet.find(injector, {
    filter: { sessionId: { $eq: sessionId } },
    top: 2,
  })
  if (sessions.length !== 1) {
    return null
  }
  return sessions[0]
}

export const findUserByName = async (
  userDataSet: DataSet<User, 'username'>,
  injector: Injector,
  userName: string,
): Promise<User> => {
  const users = await userDataSet.find(injector, { filter: { username: { $eq: userName } }, top: 2 })
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
