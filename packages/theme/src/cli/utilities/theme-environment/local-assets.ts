import {injectCdnProxy} from './proxy.js'
import {lookupMimeType} from '@shopify/cli-kit/node/mimes'
import {defineEventHandler, serveStatic, setResponseHeader} from 'h3'
import {joinPath} from '@shopify/cli-kit/node/path'
import type {Theme} from '@shopify/cli-kit/node/themes/types'
import type {DevServerContext} from './types.js'

/**
 * Handles requests for assets to the proxied Shopify CDN, serving local files.
 */
export function getAssetsHandler(_theme: Theme, ctx: DevServerContext) {
  return defineEventHandler(async (event) => {
    if (event.method !== 'GET') return

    // Matches asset filenames in an HTTP Request URL path
    const assetsFilename = event.path.match(/^\/cdn\/.*?\/assets\/([^?]+)(\?|$)/)?.[1]
    const fileKey = assetsFilename && joinPath('assets', assetsFilename)

    if (fileKey && ctx.localThemeFileSystem.files.has(fileKey)) {
      // Add header for debugging that the files come from the local assets
      setResponseHeader(event, 'X-Local-Asset', 'true')

      return serveStatic(event, {
        getContents: () => {
          const cachedValue = ctx.localThemeFileSystem.files.get(fileKey)?.value
          if (cachedValue) return injectCdnProxy(cachedValue, ctx)

          return ctx.localThemeFileSystem.read(fileKey).then((content) => injectCdnProxy(content as string, ctx))
        },
        getMeta: async () => {
          const stats = await ctx.localThemeFileSystem.stat(fileKey).catch(() => {})

          return {
            ...stats,
            type: lookupMimeType(fileKey),
          }
        },
      })
    }
  })
}
