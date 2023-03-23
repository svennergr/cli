import {ensureDevContext} from '../context.js'
import {load, writeConfigurationFile} from '../../models/app/loader.js'
import {fetchSpecifications} from '../generate/fetch-extension-specifications.js'
import {configurationFileNames} from '../../constants.js'
import {OrganizationApp} from '../../models/organization.js'
import {AppInterface} from '../../models/app/app.js'
import {Config} from '@oclif/core'
import {ensureAuthenticatedPartners} from '@shopify/cli-kit/node/session'
import {renderSuccess} from '@shopify/cli-kit/node/ui'
import {fileExists, writeFileSync} from '@shopify/cli-kit/node/fs'

export interface PullConfigOptions {
  commandConfig: Config
  directory: string
}

export default async function pullConfig(options: PullConfigOptions): Promise<void> {
  const configPath = `${options.directory}/${configurationFileNames.app}`
  const configExists = await fileExists(configPath)

  if (!configExists) {
    writeFileSync(configPath, '')
  }
  const token = await ensureAuthenticatedPartners()
  const {remoteApp} = await ensureDevContext({...options, reset: false}, token, true)
  const apiKey = remoteApp.apiKey
  const specifications = await fetchSpecifications({token, apiKey, config: options.commandConfig})
  const app = await load({directory: options.directory, specifications})

  const updatedApp = updateAppConfiguration(app, remoteApp)

  writeConfigurationFile({...updatedApp})

  renderSuccess({
    headline: 'App configuration pulled',
  })
}

function updateAppConfiguration(
  localApp: AppInterface,
  remoteApp: Omit<OrganizationApp, 'apiSecretKeys'> & {apiSecret?: string},
): AppInterface {
  localApp.webs
    .filter((web) => web.configuration.type === 'frontend')
    .map((web) => {
      web.configuration.embedded = remoteApp.embedded
      web.configuration.posEmbedded = remoteApp.posEmbedded
      web.configuration.urls = {
        ...web.configuration.urls,
        applicationUrl: remoteApp.applicationUrl,
        preferencesUrl: remoteApp.preferencesUrl,
      }
      web.configuration.appProxy = {
        ...web.configuration.appProxy,
        url: remoteApp.appProxy?.url,
        subPath: remoteApp.appProxy?.subPath,
        subPathPrefix: remoteApp.appProxy?.subPathPrefix,
      }
    })

  localApp.configuration.webhookApiVersion = remoteApp.webhookApiVersion
  localApp.configuration.gdprWebhooks = remoteApp.gdprWebhooks
  return localApp
}
