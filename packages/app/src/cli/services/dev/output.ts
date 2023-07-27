import {PartnersURLs} from './urls.js'
import {ensureDevContext} from '../context.js'
import {AppInterface, isCurrentAppSchema} from '../../models/app/app.js'
import {OrganizationApp} from '../../models/organization.js'
import {getAppConfigurationShorthand} from '../../models/app/loader.js'
import {DevSessionDeleteMutation, DevSessionDeleteSchema} from '../../api/graphql/dev_session_delete.js'
import {DevOptions} from '../dev.js'
import {partnersFqdn} from '@shopify/cli-kit/node/context/fqdn'
import {renderConcurrent, RenderConcurrentOptions, renderInfo} from '@shopify/cli-kit/node/ui'
import {openURL} from '@shopify/cli-kit/node/system'
import {basename} from '@shopify/cli-kit/node/path'
import {ensureAuthenticatedAdmin, ensureAuthenticatedPartners} from '@shopify/cli-kit/node/session'
import {adminRequest} from '@shopify/cli-kit/node/api/admin'

export async function outputUpdateURLsResult(
  updated: boolean,
  urls: PartnersURLs,
  remoteApp: Omit<OrganizationApp, 'apiSecretKeys' | 'apiKey'> & {apiSecret?: string},
  localApp: AppInterface,
) {
  const dashboardURL = await partnersURL(remoteApp.organizationId, remoteApp.id)
  if (remoteApp.newApp) {
    renderInfo({
      headline: `For your convenience, we've given your app a default URL: ${urls.applicationUrl}.`,
      body: [
        "You can update your app's URL anytime in the",
        dashboardURL,
        'But once your app is live, updating its URL will disrupt user access.',
      ],
    })
  } else if (!updated) {
    if (isCurrentAppSchema(localApp.configuration)) {
      const fileName = basename(localApp.configurationPath)
      const configName = getAppConfigurationShorthand(fileName)
      renderInfo({
        body: [
          `To update URLs manually, add the following URLs to ${fileName} under auth > redirect_urls and run\n`,
          {
            command: `npm run shopify app config push -- --config=${configName}`,
          },
          '\n\n',
          {list: {items: urls.redirectUrlWhitelist}},
        ],
      })
    } else {
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
}

export function renderDev(
  renderConcurrentOptions: RenderConcurrentOptions,
  previewUrl: string,
  devOptions?: DevOptions,
  ephemeralAppId?: string,
) {
  let options = renderConcurrentOptions

  if (previewUrl) {
    options = {
      ...options,
      onInput: (input, _key, exit) => {
        if (input === 'p' && previewUrl) {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          openURL(previewUrl)
        } else if (input === 'q') {
          // delete the dev session
          if (typeof ephemeralAppId !== 'undefined' && typeof devOptions !== 'undefined') {
            deleteDevSession(ephemeralAppId, devOptions).catch((err) => {
              // eslint-disable-next-line no-console
              console.log(`Could not delete dev session. Error: ${err}`)
            })
          }
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
  return renderConcurrent({...options, keepRunningAfterProcessesResolve: true})
}

async function partnersURL(organizationId: string, appId: string) {
  return {
    link: {
      label: 'Partners Dashboard',
      url: `https://${await partnersFqdn()}/${organizationId}/apps/${appId}/edit`,
    },
  }
}

async function deleteDevSession(devSessionId: string, devCommandOptions: DevOptions) {
  // 0. ensure we have a valid organization, app and dev store
  const {
    storeFqdn,
    remoteApp,
    remoteAppUpdated,
    updateURLs: cachedUpdateURLs,
    configName,
  } = await ensureDevContext(devCommandOptions, await ensureAuthenticatedPartners())
  // eslint-disable-next-line no-console
  console.log(storeFqdn)

  // 1. ensure we have a valid admin API session for the given store
  const adminSession = await ensureAuthenticatedAdmin(storeFqdn)
  // eslint-disable-next-line no-console
  console.log(adminSession)

  // 2. delete the dev session via the Admin API
  const devSessionDeleteResponse: DevSessionDeleteSchema = await adminRequest(DevSessionDeleteMutation, adminSession, {
    id: devSessionId,
  })

  // 3. handle errors in DevSessionDeleteSchema
  if (devSessionDeleteResponse.userErrors.length > 0) {
    // eslint-disable-next-line no-console
    console.log(devSessionDeleteResponse.userErrors)
  } else {
    // eslint-disable-next-line no-console
    console.log(`Successfully deleted dev with ID: ${devSessionId}`)
  }
}
