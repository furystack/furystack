import { Injectable } from '@furystack/inject'
import { PasswordHasher } from './password-hasher'
import { randomBytes, pbkdf2 } from 'crypto'
import { PasswordCredential } from './models'
import { PasswordCheckResult } from './models/password-check-result'

@Injectable({ lifetime: 'singleton' })
export class CryptoPasswordHasher implements PasswordHasher {
  private readonly iterations = 1000
  private readonly keylen = 64

  public async verifyCredential(
    password: string,
    { passwordHash, salt }: PasswordCredential,
  ): Promise<PasswordCheckResult> {
    const newHash = await new Promise((resolve, reject) =>
      pbkdf2(password, salt, this.iterations, this.keylen, 'sha512', (err, key) =>
        err ? reject(err) : resolve(key.toString('hex')),
      ),
    )
    if (newHash === passwordHash) {
      return {
        isValid: true,
      }
    }
    return {
      isValid: false,
      reason: 'badUsernameOrPassword',
    }
  }
  public async createCredential(userName: string, password: string) {
    const salt = randomBytes(16).toString('hex')
    const passwordHash = await new Promise<string>((resolve, reject) =>
      pbkdf2(password, salt, this.iterations, this.keylen, 'sha512', (err, key) =>
        err ? reject(err) : resolve(key.toString('hex')),
      ),
    )
    return {
      userName,
      salt,
      passwordHash,
      creationDate: new Date().toISOString(),
    }
  }
}
