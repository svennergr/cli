import {reconcileAndPollThemeEditorChanges} from './remote-theme-watcher.js'
import {getHotReloadHandler, setupInMemoryTemplateWatcher} from './hot-reload/server.js'
import {getHtmlHandler} from './html.js'
import {getAssetsHandler} from './local-assets.js'
import {getProxyHandler} from './proxy.js'
import {uploadTheme} from '../theme-uploader.js'
import {renderTasksToStdErr} from '../theme-ui.js'
import {createApp, toNodeListener} from 'h3'
import {fetchChecksums} from '@shopify/cli-kit/node/themes/api'
import {createServer} from 'node:http'
import type {Checksum, Theme} from '@shopify/cli-kit/node/themes/types'
import type {DevServerContext} from './types.js'

export function setupDevServer(theme: Theme, ctx: DevServerContext) {
  const watcherPromise = setupInMemoryTemplateWatcher(ctx)
  const envSetup = ensureThemeEnvironmentSetup(theme, ctx)
  const server = createDevelopmentServer(theme, ctx)
  const workPromise = Promise.all([watcherPromise, envSetup.workPromise]).then(() => {})

  return {
    workPromise,
    dispatchEvent: server.dispatch,
    renderDevSetupProgress: envSetup.renderProgress,
    serverStart: () => workPromise.then(server.start),
  }
}

function ensureThemeEnvironmentSetup(theme: Theme, ctx: DevServerContext) {
  const remoteChecksumsPromise = fetchChecksums(theme.id, ctx.session)

  const reconcilePromise = remoteChecksumsPromise.then((remoteChecksums) =>
    ctx.options.themeEditorSync
      ? reconcileAndPollThemeEditorChanges(theme, ctx.session, remoteChecksums, ctx.localThemeFileSystem, {
          noDelete: ctx.options.noDelete,
          ignore: ctx.options.ignore,
          only: ctx.options.only,
        })
      : remoteChecksums,
  )

  const uploadPromise = reconcilePromise.then(async (remoteChecksums: Checksum[]) =>
    uploadTheme(theme, ctx.session, remoteChecksums, ctx.localThemeFileSystem, {
      nodelete: ctx.options.noDelete,
      ignore: ctx.options.ignore,
      only: ctx.options.only,
      deferPartialWork: true,
    }),
  )

  return {
    workPromise: uploadPromise.then((result) => result.workPromise),
    renderProgress: async () => {
      if (ctx.options.themeEditorSync) {
        await renderTasksToStdErr([
          {
            title: 'Performing file synchronization. This may take a while...',
            task: async () => {
              await reconcilePromise
            },
          },
        ])
      }

      const {renderThemeSyncProgress} = await uploadPromise

      await renderThemeSyncProgress()
    },
  }
}

interface DevelopmentServerInstance {
  close: () => Promise<void>
}

function createDevelopmentServer(theme: Theme, ctx: DevServerContext) {
  const app = createApp()

  if (ctx.options.liveReload !== 'off') {
    app.use(getHotReloadHandler(theme, ctx))
  }

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
