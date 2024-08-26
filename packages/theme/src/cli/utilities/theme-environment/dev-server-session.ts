import {getStorefrontSessionCookies} from './storefront-session.js'
import {buildBaseStorefrontUrl} from './storefront-renderer.js'
import {DevServerSession} from './types.js'
import {outputDebug} from '@shopify/cli-kit/node/output'
import {AdminSession, ensureAuthenticatedStorefront, ensureAuthenticatedThemes} from '@shopify/cli-kit/node/session'

// 30 minutes in miliseconds.
const SESSION_TIMEOUT_IN_MS = 30 * 60 * 1000

/**
 * Because this runs with the already legacy implementation in place,
 *     ...options.adminSession,
    storefrontToken: options.storefrontToken,
    storefrontPassword,

    in thefuture we also to receive only store and password, and this method
    should do the rest
 */
export async function initializeDevServerSession(
  themeId: string,
  adminSession: AdminSession,
  storefrontToken: string,
  adminPassword: string,
  storefrontPassword?: string,
) {
  const {token, storeFqdn} = adminSession
  const updatedAt = new Date()

  const baseUrl = buildBaseStorefrontUrl(adminSession)
  const sessionCookies = await getStorefrontSessionCookies(baseUrl, themeId, storefrontPassword, {})

  const storefrontDigestCookie = sessionCookies.storefront_digest
  const shopifyEssentialCookie = sessionCookies._shopify_essential

  const session: DevServerSession = {
    updatedAt,
    shopifyEssentialCookie,
    storeFqdn,
    storefrontDigestCookie,
    storefrontToken,
    token,
  }

  setInterval(() => {
    outputDebug('Refreshing theme session...')

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    refreshTokens(session, storeFqdn, adminPassword)
  }, SESSION_TIMEOUT_IN_MS)

  return session
}

export async function refreshTokens(session: DevServerSession, store: string, password?: string | undefined) {
  const {token} = await ensureAuthenticatedThemes(store, password, [], true)
  const storefrontToken = await ensureAuthenticatedStorefront([], password)

  session.token = token
  session.storefrontToken = storefrontToken
}
