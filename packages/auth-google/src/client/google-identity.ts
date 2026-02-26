import type { GoogleAccountsId, GoogleIdentityOptions, GsiButtonConfiguration } from './gis-types.js'

/**
 * Controls returned by {@link initializeGoogleAuth} for rendering
 * buttons and showing the One Tap prompt.
 */
export type GoogleAuthControls = {
  /** Renders the "Sign in with Google" button in the given element. */
  renderButton: (element: HTMLElement, options?: GsiButtonConfiguration) => void
  /** Shows the One Tap prompt. */
  prompt: (momentListener?: (notification: { isNotDisplayed: () => boolean }) => void) => void
  /** Disables automatic sign-in selection. */
  disableAutoSelect: () => void
}

declare const google: { accounts: { id: GoogleAccountsId } }

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client'

let loadPromise: Promise<void> | null = null

/**
 * Dynamically loads the Google Identity Services script.
 * Idempotent -- returns immediately if the script is already loaded.
 *
 * @returns A promise that resolves once `google.accounts.id` is available
 */
export const loadGoogleIdentityServices = (): Promise<void> => {
  if (loadPromise) return loadPromise

  if (typeof document !== 'undefined' && typeof google !== 'undefined' && google?.accounts?.id) {
    loadPromise = Promise.resolve()
    return loadPromise
  }

  loadPromise = new Promise<void>((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('loadGoogleIdentityServices requires a browser environment.'))
      return
    }

    const script = document.createElement('script')
    script.src = GIS_SCRIPT_URL
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => {
      loadPromise = null
      reject(new Error('Failed to load Google Identity Services script.'))
    }
    document.head.appendChild(script)
  })

  return loadPromise
}

/**
 * Loads the GIS script (if needed) and initialises `google.accounts.id`.
 *
 * @param options GIS initialization options (must include `client_id` and `callback`)
 * @returns Controls for rendering buttons and showing the prompt
 */
export const initializeGoogleAuth = async (options: GoogleIdentityOptions): Promise<GoogleAuthControls> => {
  await loadGoogleIdentityServices()
  google.accounts.id.initialize(options)
  return {
    renderButton: (element, buttonOptions) => google.accounts.id.renderButton(element, buttonOptions ?? {}),
    prompt: (momentListener) => google.accounts.id.prompt(momentListener),
    disableAutoSelect: () => google.accounts.id.disableAutoSelect(),
  }
}
