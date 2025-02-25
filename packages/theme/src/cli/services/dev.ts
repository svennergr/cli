import {renderConfirmationPrompt, renderSuccess, renderWarning} from '@shopify/cli-kit/node/ui'
import {joinPath} from '@shopify/cli-kit/node/path'
import {AdminSession, ensureAuthenticatedStorefront, ensureAuthenticatedThemes} from '@shopify/cli-kit/node/session'
import {execCLI2} from '@shopify/cli-kit/node/ruby'
import {outputDebug} from '@shopify/cli-kit/node/output'
import {useEmbeddedThemeCLI} from '@shopify/cli-kit/node/context/local'
import {access} from 'node:fs/promises'

const DEFAULT_HOST = '127.0.0.1'
const DEFAULT_PORT = '9292'

// Tokens are valid for 120 min, better to be safe and refresh every 110 min
const THEME_REFRESH_TIMEOUT_IN_MS = 110 * 60 * 1000

export interface DevOptions {
  adminSession: AdminSession
  storefrontToken: string
  directory: string
  store: string
  password?: string
  theme: string
  host?: string
  port?: string
  force: boolean
  flagsToPass: string[]
}

export async function dev(options: DevOptions) {
  const command = ['theme', 'serve', options.directory, ...options.flagsToPass]

  if (!(await validThemeDirectory(options.directory)) && !(await currentDirectoryConfirmed(options.force))) {
    return
  }

  renderLinks(options.store, options.theme, options.host, options.port)

  let adminToken: string | undefined = options.adminSession.token
  let storefrontToken: string | undefined = options.storefrontToken

  if (!options.password && useEmbeddedThemeCLI()) {
    adminToken = undefined
    storefrontToken = undefined

    setInterval(() => {
      outputDebug('Refreshing theme session tokens...')
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      refreshTokens(options.store, options.password)
    }, THEME_REFRESH_TIMEOUT_IN_MS)
  }

  await execCLI2(command, {store: options.store, adminToken, storefrontToken})
}

export function renderLinks(store: string, themeId: string, host = DEFAULT_HOST, port = DEFAULT_PORT) {
  renderSuccess({
    body: [
      {
        list: {
          title: {bold: 'Preview your theme'},
          items: [
            {
              link: {
                url: `http://${host}:${port}`,
              },
            },
          ],
        },
      },
    ],
    nextSteps: [
      [
        {
          link: {
            label: 'Customize your theme at the theme editor',
            url: `https://${store}/admin/themes/${themeId}/editor`,
          },
        },
      ],
      [
        {
          link: {
            label: 'Share your theme preview',
            url: `https://${store}/?preview_theme_id=${themeId}`,
          },
        },
      ],
    ],
  })
}

export const REQUIRED_FOLDERS = ['config', 'layout', 'sections', 'templates']

export function validThemeDirectory(currentDirectory: string): Promise<boolean> {
  return new Promise((resolve) => {
    Promise.all(REQUIRED_FOLDERS.map((requiredFolder) => access(joinPath(currentDirectory, requiredFolder))))
      .then(() => resolve(true))
      .catch(() => resolve(false))
  })
}

export function currentDirectoryConfirmed(force: boolean) {
  if (force) {
    return true
  }

  renderWarning({body: 'It doesn’t seem like you’re running this command in a theme directory.'})

  if (!process.stdout.isTTY) {
    return true
  }

  return renderConfirmationPrompt({
    message: 'Do you want to proceed?',
  })
}

export function showDeprecationWarnings(args: string[]) {
  const eFlagIndex = args.findIndex((arg) => arg === '-e')
  const wrongEnvFlag = eFlagIndex >= 0 && (!args[eFlagIndex + 1] || args[eFlagIndex + 1]?.startsWith('-'))
  if (wrongEnvFlag) {
    renderWarning({
      body: [
        'If you want to enable synchronization with Theme Editor, please use',
        {command: '--theme-editor-sync'},
        {char: '.'},
        'The shortcut',
        {command: '-e'},
        'is now reserved for environments.',
      ],
    })
  }
}

export async function refreshTokens(store: string, password: string | undefined) {
  const adminSession = await ensureAuthenticatedThemes(store, password, [], true)
  const storefrontToken = await ensureAuthenticatedStorefront([], password)
  if (useEmbeddedThemeCLI()) {
    await execCLI2(['theme', 'token', '--admin', adminSession.token, '--sfr', storefrontToken])
  }
  return {adminSession, storefrontToken}
}
