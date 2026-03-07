import type { SecuritySchemeObject } from '@furystack/rest'

import type { AuthenticationProvider } from '../authentication-providers/authentication-provider.js'

const PROVIDER_SCHEME_MAP: Record<string, { schemeName: string; scheme: SecuritySchemeObject }> = {
  'basic-auth': {
    schemeName: 'basicAuth',
    scheme: { type: 'http', scheme: 'basic' },
  },
  'cookie-auth': {
    schemeName: 'cookieAuth',
    scheme: { type: 'apiKey', in: 'cookie', name: 'session' },
  },
  'jwt-bearer': {
    schemeName: 'bearerAuth',
    scheme: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
  },
}

/**
 * Maps FuryStack authentication providers to their corresponding OpenAPI security scheme objects.
 * Known provider names (`basic-auth`, `cookie-auth`, `jwt-bearer`) are mapped to standard OpenAPI
 * security schemes. Unknown provider names are silently ignored.
 *
 * Falls back to a default `cookieAuth` scheme if no known providers are found.
 *
 * @param providers - The list of active authentication providers
 * @returns A record of OpenAPI security scheme name to SecuritySchemeObject
 */
export const mapProvidersToSecuritySchemes = (
  providers: AuthenticationProvider[],
): Record<string, SecuritySchemeObject> => {
  const schemes: Record<string, SecuritySchemeObject> = {}
  for (const provider of providers) {
    const mapping = PROVIDER_SCHEME_MAP[provider.name]
    if (mapping) {
      schemes[mapping.schemeName] = mapping.scheme
    }
  }
  return Object.keys(schemes).length > 0 ? schemes : { cookieAuth: PROVIDER_SCHEME_MAP['cookie-auth'].scheme }
}
