import {PartnersURLs} from './urls.js'
import {AppInterface} from '../../models/app/app.js'
import {OrganizationApp} from '../../models/organization.js'
import {ExtensionInstance} from '../../models/extensions/extension-instance.js'
import {partnersFqdn} from '@shopify/cli-kit/node/context/fqdn'
import {renderConcurrent, RenderConcurrentOptions, renderInfo} from '@shopify/cli-kit/node/ui'
import {outputContent, outputInfo, outputToken} from '@shopify/cli-kit/node/output'
import {openURL} from '@shopify/cli-kit/node/system'

export async function outputUpdateURLsResult(
  updated: boolean,
  urls: PartnersURLs,
  app: Omit<OrganizationApp, 'apiSecretKeys' | 'apiKey'> & {apiSecret?: string},
) {
  const dashboardURL = await partnersURL(app.organizationId, app.id)
  if (app.newApp) {
    renderInfo({
      headline: `For your convenience, we've given your app a default URL: ${urls.applicationUrl}.`,
      body: [
        "You can update your app's URL anytime in the",
        dashboardURL,
        'But once your app is live, updating its URL will disrupt user access.',
      ],
    })
  } else if (!updated) {
    renderInfo({
      body: [
        'To make URL updates manually, you can add the following URLs as redirects in your',
        dashboardURL,
        {char: ':'},
        '\n\n',
        {list: {items: urls.redirectUrlWhitelist}},
      ],
    })
  }
}

export function outputExtensionsMessages(app: AppInterface) {
  outputFunctionsMessage(app.allExtensions.filter((ext) => ext.isFunctionExtension))
  outputThemeExtensionsMessage(app.allExtensions.filter((ext) => ext.isThemeExtension))
}

export function renderDev(renderConcurrentOptions: RenderConcurrentOptions, previewUrl: string | undefined) {
  let options = renderConcurrentOptions

  if (previewUrl) {
    options = {
      ...options,
      onInput: (input, _key, exit) => {
        if (input === 'p' && previewUrl) {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          openURL(previewUrl)
        } else if (input === 'q') {
          exit()
        }
      },
      footer: {
        shortcuts: [
          {
            key: 'p',
            action: 'preview in your browser',
          },
          {
            key: 'q',
            action: 'quit',
          },
        ],
        subTitle: `Preview URL: ${previewUrl}`,
      },
    }
  }
  return renderConcurrent(options)
}

function outputFunctionsMessage(extensions: ExtensionInstance[]) {
  if (extensions.length === 0) return
  const names = extensions.map((ext) => ext.configuration.name)
  const heading = outputToken.heading(names.join(', '))
  const message = `These extensions need to be deployed to be manually tested.
One testing option is to use a separate app dedicated to staging.`
  outputInfo(outputContent`${heading}\n${message}\n`)
}

function outputThemeExtensionsMessage(extensions: ExtensionInstance[]) {
  if (extensions.length === 0) return
  for (const extension of extensions) {
    const message = extension.previewMessage('', '')
    if (message) outputInfo(message)
  }
}

async function partnersURL(organizationId: string, appId: string) {
  return {
    link: {
      label: 'Partners Dashboard',
      url: `https://${await partnersFqdn()}/${organizationId}/apps/${appId}/edit`,
    },
  }
}
