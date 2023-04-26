import {load, writeConfigurationFile} from '../../models/app/loader.js'
import {fetchSpecifications} from '../generate/fetch-extension-specifications.js'
import {mergeAppConfiguration} from '../merge-configuration.js'
import {selectOrgStoreAppEnv} from '../context.js'
import {Config} from '@oclif/core'
import {ensureAuthenticatedPartners} from '@shopify/cli-kit/node/session'
import {renderSuccess} from '@shopify/cli-kit/node/ui'
import {relativePath} from '@shopify/cli-kit/node/path'

export interface ConnectOptions {
  commandConfig: Config
  directory: string
}

export default async function connect(options: ConnectOptions): Promise<void> {
  const token = await ensureAuthenticatedPartners()
  const {app: remoteApp, appEnv, organization, store} = await selectOrgStoreAppEnv(token, options.directory)
  const apiKey = remoteApp.apiKey
  const specifications = await fetchSpecifications({token, apiKey, config: options.commandConfig})

  const app = await load({directory: options.directory, specifications, allowEmpty: true})
  app.configuration.remoteShopifyApp = {
    apiKey: remoteApp.apiKey,
    organizationId: organization.id,
    devStore: store!.shopDomain,
    noUpdate: false,
  }

  const mergedLocalApp = mergeAppConfiguration(app, remoteApp)

  const file = writeConfigurationFile({...mergedLocalApp}, appEnv)

  renderSuccess({
    headline: `App "${remoteApp.title}" connected to this codebase, file ${relativePath(
      mergedLocalApp.directory,
      file,
    )} created`,
  })
}
