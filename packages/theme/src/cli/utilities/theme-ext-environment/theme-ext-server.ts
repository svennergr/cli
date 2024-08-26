import {mountThemeExtensionFileSystem} from './theme-ext-fs.js'
import {DevServerContext} from '../theme-environment/types.js'
import {getHtmlHandler} from '../theme-environment/html.js'
import {getAssetsHandler} from '../theme-environment/local-assets.js'
import {getProxyHandler} from '../theme-environment/proxy.js'
import {emitHotReloadEvent, getHotReloadHandler} from '../theme-environment/hot-reload/server.js'
import {createApp, toNodeListener} from 'h3'
import {AdminSession} from '@shopify/cli-kit/node/session'
import {extname} from '@shopify/cli-kit/node/path'
import {consoleLog} from '@shopify/cli-kit/node/output'
import {createServer} from 'node:http'
import type {Theme, ThemeFSEventPayload} from '@shopify/cli-kit/node/themes/types'

interface DevelopmentServerInstance {
  close: () => Promise<void>
}

export interface DevExtensionServerContext {
  adminSession: AdminSession
  storefrontToken: string
  themeExtensionPort: number
  themeExtensionDirectory: string
  storefrontPassword?: string
}

export async function initializeDevelopmentExtensionServer(theme: Theme, devExt: DevExtensionServerContext) {
  const ctx = contextDevServerContext(devExt)

  await setupInMemoryTemplateWatcher(ctx)

  return createDevelopmentExtensionServer(theme, ctx)
}

export function createDevelopmentExtensionServer(theme: Theme, ctx: DevServerContext) {
  const app = createApp()

  app.use(getHotReloadHandler(theme, ctx))
  app.use(getAssetsHandler(theme, ctx))
  app.use(getProxyHandler(theme, ctx))
  app.use(getHtmlHandler(theme, ctx))

  const server = createServer(toNodeListener(app))

  return {
    dispatch: app.handler.bind(app),
    start: async (): Promise<DevelopmentServerInstance> => {
      return new Promise((resolve) =>
        server.listen({port: ctx.options.port, host: ctx.options.host}, () =>
          resolve({
            close: async () => {
              await Promise.all([
                new Promise((resolve) => {
                  server.closeAllConnections()
                  server.close(resolve)
                }),
              ])
            },
          }),
        ),
      )
    },
  }
}

function contextDevServerContext(extensionContext: DevExtensionServerContext): DevServerContext {
  const {
    adminSession,
    storefrontToken,
    storefrontPassword,
    themeExtensionPort,
    themeExtensionDirectory: directory,
  } = extensionContext

  const host = '127.0.0.1'
  const port = themeExtensionPort ?? 9293
  const localThemeFileSystem = mountThemeExtensionFileSystem(directory)

  return {
    session: {
      ...adminSession,
      storefrontToken,
      storefrontPassword,
      expiresAt: new Date(),
    },
    localThemeFileSystem,
    directory,
    options: {
      themeEditorSync: false,
      noDelete: false,
      ignore: [],
      only: [],
      host,
      port: port.toString(),
      liveReload: 'hot-reload',
      open: false,
    },
  }
}

export async function setupInMemoryTemplateWatcher(ctx: DevServerContext) {
  const localThemeFileSystem = ctx.localThemeFileSystem

  const handleFileUpdate = ({fileKey, onContent: _a, onSync: _b}: ThemeFSEventPayload) => {
    const extension = extname(fileKey)
    const type = fileKey.split('/')[0]

    // localThemeFileSystem.files.forEach((key, value) => {
    //   consoleLog(`key > ${JSON.stringify(key)}`)
    //   consoleLog(`val > ${JSON.stringify(value)}`)
    // })

    // const needsTemplateUpdate = ['.liquid', '.json'].includes(extension)
    // const isAsset = fileKey.startsWith('assets/')

    if (type === 'assets' && extension === '.css') {
      consoleLog(`>>> ${fileKey}`)
      emitHotReloadEvent({type: 'ext-css', key: fileKey})
    }

    // if (isAsset) {
    //   if (needsTemplateUpdate) {
    //     // If the asset is a .css.liquid or similar, we wait until it's been synced:
    //     onSync(() => {
    //       // return triggerHotReload(fileKey, ctx)
    //     })
    //   } else {
    //     // Otherwise, just full refresh directly:
    //     // triggerHotReload(fileKey, ctx)
    //   }
    // } else if (needsTemplateUpdate) {
    //   // Update in-memory templates for hot reloading:
    //   onContent((_content) => {
    //     // inMemoryTemplateFiles.add(fileKey)
    //     if (extension === '.json') {
    //       // saveSectionsFromJson(fileKey, content)
    //     }
    //     // triggerHotReload(fileKey, ctx)

    //     // Delete template from memory after syncing but keep
    //     // JSON values to read section names for hot-reloading sections.
    //     onSync(() => {
    //       // return inMemoryTemplateFiles.delete(fileKey)
    //     })
    //   })
    // }
  }

  localThemeFileSystem.addEventListener('add', handleFileUpdate)
  localThemeFileSystem.addEventListener('change', handleFileUpdate)
  localThemeFileSystem.addEventListener('unlink', ({fileKey: _, onSync}) => {
    onSync(() => {
      // Delete memory info after syncing with the remote instance because we
      // don't need to pass replaceTemplates anymore.
      // ----------
      // inMemoryTemplateFiles.delete(fileKey)
      // sectionNamesByFile.delete(fileKey)
    })
  })

  // Once the initial files are loaded, read all the JSON files so that
  // we gather the existing section names early. This way, when a section
  // is reloaded, we can quickly find what to update in the DOM without
  // spending time reading files.

  // ----------
  return localThemeFileSystem.ready().then(async () => {
    await localThemeFileSystem.startWatcher()
    const files = [...localThemeFileSystem.files]
    return Promise.allSettled(
      files.map(async ([fileKey, _file]) => {
        if (fileKey.endsWith('.json')) {
          // const content = file.value ?? (await ctx.localThemeFileSystem.read(fileKey))
          // if (content && typeof content === 'string') saveSectionsFromJson(fileKey, content)
        }
      }),
    )
  })
}
