/**
 * Credential response from Google Identity Services.
 * @see https://developers.google.com/identity/gsi/web/reference/js-reference#CredentialResponse
 */
export type GoogleCredentialResponse = {
  /** The ID token string */
  credential: string
  /** How the credential was selected (e.g. `'auto'`, `'user'`, `'btn'`) */
  select_by: string
  /** The client ID used for the request */
  client_id: string
}

/**
 * Options for `google.accounts.id.initialize()`.
 * @see https://developers.google.com/identity/gsi/web/reference/js-reference#IdConfiguration
 */
export type GoogleIdentityOptions = {
  client_id: string
  callback: (response: GoogleCredentialResponse) => void
  auto_select?: boolean
  cancel_on_tap_outside?: boolean
  context?: 'signin' | 'signup' | 'use'
  itp_support?: boolean
  login_uri?: string
  nonce?: string
  use_fedcm_for_prompt?: boolean
}

/**
 * Configuration for the rendered Sign-In button.
 * @see https://developers.google.com/identity/gsi/web/reference/js-reference#GsiButtonConfiguration
 */
export type GsiButtonConfiguration = {
  type?: 'standard' | 'icon'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  logo_alignment?: 'left' | 'center'
  width?: string
  locale?: string
}

/**
 * Minimal typing for the `google.accounts.id` global.
 */
export type GoogleAccountsId = {
  initialize: (options: GoogleIdentityOptions) => void
  renderButton: (element: HTMLElement, config: GsiButtonConfiguration) => void
  prompt: (momentListener?: (notification: { isNotDisplayed: () => boolean }) => void) => void
  disableAutoSelect: () => void
  revoke: (hint: string, callback?: (response: { successful: boolean; error?: string }) => void) => void
}
