import type {createApp} from '@shopify/extensibility-host-runtimes/runtimes/AppBridgeRuntime/client'

type App = ReturnType<typeof createApp>

const HOSTS_WITH_INJECTIONS = new Set([
  '127.0.0.1',
  'localhost',
  location.host,
  // haha
  'x.localtest.me',
])

const originalFetch = globalThis.fetch

export function createFetch(app: App) {
  return async function fetch(
    url: Parameters<typeof originalFetch>[0],
    init: Parameters<typeof originalFetch>[1],
  ): ReturnType<typeof originalFetch> {
    const req = new Request(url, init)
    if (HOSTS_WITH_INJECTIONS.has(new URL(req.url).hostname)) {
      await injectAuthHeader(app, req)
      await injectCookies(app, req)
    }
    const resp = await originalFetch(req)
    await extractCookies(app, resp)
    return resp
  }
}

async function injectAuthHeader(app: App, req: Request) {
  const token = await app.api.sessionToken.get()
  req.headers.set('X-Shopify-Session-Token', token)
}

interface Cookie {
  name: string
  value: string
  domain?: string
  expires?: string
  httpOnly?: string
  path?: string
  secure?: string
  sameSite?: string
}

async function injectCookies(app: App, req: Request) {
  const host = new URL(req.url).hostname
  const cookiejar: {[key: string]: Cookie} = (await app.api.storage.get(`cookiejar:${host}`)) ?? {}
  const timestamp = new Date().getTime()
  const headerValue = Object.entries(cookiejar)
    .filter(([_, cookie]) => Number(cookie.expires ?? 0) > timestamp)
    .map(([key, cookie]) => `${encodeURIComponent(key)}=${encodeURIComponent(cookie?.value ?? '')}`)
    .join('; ')
  if (headerValue) {
    req.headers.set('x-cookie', headerValue)
  }
}

async function extractCookies(app: App, resp: Response) {
  const host = new URL(resp.url).hostname
  const cookiejar: {[key: string]: Cookie} = (await app.api.storage.get(`cookiejar:${host}`)) ?? {}
  for (const [key, value] of resp.headers.entries()) {
    if (key.toLowerCase() !== 'x-set-cookie') continue
    const cookie = parseCookie(value)
    cookiejar[cookie.name] = cookie
  }
  await app.api.storage.set(`cookiejar:${host}`, cookiejar)
}

function parseCookie(hdr: string): Cookie {
  const [keyval, ...attributes] = hdr.split(';')
  const [name, value] = keyval.split('=')
  return Object.fromEntries([
    ['name', name],
    ['value', value],
    ...attributes.map((attr) => {
      // eslint-disable-next-line prefer-const
      let [name, ...parts] = attr.split('=')
      // Make sure attribute starts with a lower case letter
      name = name.trim()
      name = name.slice(0, 1).toLowerCase() + name.slice(1)
      return [name, parts?.join('=')?.trim()]
    }),
  ])
}
