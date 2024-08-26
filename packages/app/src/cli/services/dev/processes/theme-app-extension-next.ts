import {BaseProcess, DevProcessFunction} from './types.js'
import {ExtensionInstance} from '../../../models/extensions/extension-instance.js'
import {DeveloperPlatformClient} from '../../../utilities/developer-platform-client.js'
import {HostThemeManager} from '../../../utilities/extensions/theme/host-theme-manager.js'
import {outputDebug, outputInfo} from '@shopify/cli-kit/node/output'
import {AdminSession, ensureAuthenticatedAdmin, ensureAuthenticatedStorefront} from '@shopify/cli-kit/node/session'
import {fetchTheme} from '@shopify/cli-kit/node/themes/api'
import {AbortError} from '@shopify/cli-kit/node/error'
import {Theme} from '@shopify/cli-kit/node/themes/types'
import {renderInfo, renderTasks, Task} from '@shopify/cli-kit/node/ui'
import {initializeDevelopmentExtensionServer, ensureValidPassword, isStorefrontPasswordProtected} from '@shopify/theme'

interface ThemeAppExtensionServerOptions {
  adminSession: AdminSession
  storefrontToken: string
  developerPlatformClient: DeveloperPlatformClient
  storefrontPassword?: string
  themeId?: string
  themeExtensionPort?: number
  themeExtensionDirectory: string
}

interface HostThemeSetupOptions {
  allExtensions: ExtensionInstance[]
  storeFqdn: string
  theme?: string
  themeExtensionPort?: number
  developerPlatformClient: DeveloperPlatformClient
}

export interface PreviewThemeAppExtensionsProcess extends BaseProcess<ThemeAppExtensionServerOptions> {
  type: 'theme-app-extensions'
}

export async function setupPreviewThemeAppExtensionsProcess(
  options: HostThemeSetupOptions,
): Promise<PreviewThemeAppExtensionsProcess | undefined> {
  outputInfo('This feature is currently in development and is not ready for use or testing yet.')

  const {allExtensions, storeFqdn, theme, themeExtensionPort, developerPlatformClient} = options

  const themeExtensions = allExtensions.filter((ext) => ext.isThemeExtension)
  if (themeExtensions.length === 0) {
    return
  }

  const themeExtension = themeExtensions[0]!
  const themeExtensionDirectory = themeExtension.directory
  const adminSession = await ensureAuthenticatedAdmin(storeFqdn)
  const storefrontToken = await ensureAuthenticatedStorefront([])
  const storefrontPassword = (await isStorefrontPasswordProtected(adminSession.storeFqdn))
    ? await ensureValidPassword('', adminSession.storeFqdn)
    : undefined

  const themeId = await findOrCreateHostTheme(adminSession, theme)

  renderInfo({
    headline: {info: 'Setup your theme app extension in the host theme:'},
    link: {
      label: `https://${adminSession.storeFqdn}/admin/themes/${themeId}/editor`,
      url: `https://${adminSession.storeFqdn}/admin/themes/${themeId}/editor`,
    },
  })

  return {
    type: 'theme-app-extensions',
    prefix: 'theme-extensions',
    function: runThemeAppExtensionsServerNext,
    options: {
      adminSession,
      storefrontToken,
      storefrontPassword,
      developerPlatformClient,
      themeId,
      themeExtensionPort,
      themeExtensionDirectory,
    },
  }
}

export async function findOrCreateHostTheme(adminSession: AdminSession, theme?: string): Promise<string> {
  let hostTheme: Theme | undefined
  if (theme) {
    outputDebug(`Fetching theme with provided id ${theme}`)
    hostTheme = await fetchTheme(parseInt(theme, 10), adminSession)
  } else {
    const themeManager = new HostThemeManager(adminSession, {devPreview: true})
    const tasks: Task[] = [
      {
        title: 'Configuring host theme for theme app extension',
        task: async () => {
          outputDebug('Finding or creating host theme for theme app extensions')
          hostTheme = await themeManager.findOrCreate()
        },
      },
    ]
    await renderTasks(tasks)
  }

  if (!hostTheme) {
    throw new AbortError(`Could not find or create a host theme for theme app extensions`)
  }

  return hostTheme.id.toString()
}
const runThemeAppExtensionsServerNext: DevProcessFunction<ThemeAppExtensionServerOptions> = async (
  {stdout: _stdout, stderr: _stderr, abortSignal: _abortSignal},
  options,
) => {
  const themeManager = new HostThemeManager(options.adminSession, {devPreview: true})
  const theme = await themeManager.findOrCreate()

  const server = await initializeDevelopmentExtensionServer(theme, {
    adminSession: options.adminSession,
    storefrontToken: options.storefrontToken,
    storefrontPassword: options.storefrontPassword,
    themeExtensionDirectory: options.themeExtensionDirectory,
    themeExtensionPort: options.themeExtensionPort ?? 9293,
  })

  await server.start()
}
