import { defineService, type Token } from '@furystack/inject'
import { pbkdf2, randomBytes } from 'crypto'
import type { PasswordCheckResult } from './models/index.js'
import type { PasswordHasher } from './password-hasher.js'

const ITERATIONS = 1000
const KEY_LENGTH = 64
const SALT_BYTES = 16

const deriveHash = (password: string, salt: string): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, 'sha512', (err, key) => {
      if (err) {
        reject(err)
        return
      }
      resolve(key.toString('hex'))
    })
  })

/**
 * Default PBKDF2-based {@link PasswordHasher} implementation. Uses SHA-512
 * with 1000 iterations and a 64-byte derived key length.
 *
 * Swap this token in {@link SecurityPolicy.hasher} to replace the hashing
 * algorithm — for example with a stronger Argon2 implementation or a
 * delegated hashing service.
 */
export const CryptoPasswordHasher: Token<PasswordHasher, 'singleton'> = defineService({
  name: 'furystack/security/CryptoPasswordHasher',
  lifetime: 'singleton',
  factory: (): PasswordHasher => ({
    verifyCredential: async (password, { passwordHash, salt }): Promise<PasswordCheckResult> => {
      const candidate = await deriveHash(password, salt)
      if (candidate === passwordHash) {
        return { isValid: true }
      }
      return { isValid: false, reason: 'badUsernameOrPassword' }
    },
    createCredential: async (userName, password) => {
      const salt = randomBytes(SALT_BYTES).toString('hex')
      const passwordHash = await deriveHash(password, salt)
      return {
        userName,
        salt,
        passwordHash,
        creationDate: new Date().toISOString(),
      }
    },
  }),
})
