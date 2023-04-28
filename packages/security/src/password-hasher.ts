import { Injectable } from '@furystack/inject'
import type { PasswordCheckResult, PasswordCredential } from './models/index.js'

@Injectable({ lifetime: 'singleton' })
export class PasswordHasher {
  public createCredential(_userName: string, _password: string): Promise<PasswordCredential> {
    throw Error('Set up hasher - TODO')
  }

  public verifyCredential(_password: string, _credential: PasswordCredential): Promise<PasswordCheckResult> {
    throw Error('Set up hasher - TODO')
  }
}
