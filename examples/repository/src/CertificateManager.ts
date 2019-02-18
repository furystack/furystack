import { Injectable } from '@furystack/inject'
import { existsSync, readFileSync } from 'fs'
import { ServerOptions } from 'https'
import { join } from 'path'

/**
 * Manager class for https certificates
 */
@Injectable()
export class CertificateManager {
  private fileExists = existsSync
  private readFile = readFileSync

  public setup() {
    if (this.fileExists(join(__dirname, '..', 'sslcert', 'server.pfx'))) {
      const pfx = this.readFile(join(__dirname, '..', 'sslcert/server.pfx'))
      this.credentials = { pfx, passphrase: 'AsdAsd123' }
    } else {
      const privateKey = this.readFile(join(__dirname, 'sslcert', 'server.key'), 'utf8')
      const certificate = this.readFile(join(__dirname, 'sslcert', 'server.crt'), 'utf8')
      this.credentials = { key: privateKey, cert: certificate }
    }
  }

  private credentials!: ServerOptions
  public getCredentials() {
    if (!this.credentials) {
      if (this.fileExists(join(__dirname, '..', 'sslcert', 'server.pfx'))) {
        const pfx = this.readFile(join(__dirname, '..', 'sslcert/server.pfx'))
        this.credentials = { pfx, passphrase: 'AsdAsd123' }
      } else {
        const privateKey = this.readFile(join(__dirname, 'sslcert', 'server.key'), 'utf8')
        const certificate = this.readFile(join(__dirname, 'sslcert', 'server.crt'), 'utf8')
        this.credentials = { key: privateKey, cert: certificate }
      }
    }
    return this.credentials
  }
}
