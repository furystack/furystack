/**
 * Model class for JWT refresh tokens, stored in a PhysicalStore for revocation support.
 */
export class RefreshToken {
  declare token: string
  declare username: string
  declare createdAt: string
  declare expiresAt: string
  declare revokedAt?: string
  declare replacedByToken?: string
}
