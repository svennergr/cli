import {ensureDevContext} from '../context.js'
import {load, writeConfigurationFile} from '../../models/app/loader.js'
import {fetchSpecifications} from '../generate/fetch-extension-specifications.js'
import {Config} from '@oclif/core'
import {ensureAuthenticatedPartners} from '@shopify/cli-kit/node/session'
import {renderSuccess} from '@shopify/cli-kit/node/ui'

export interface PullConfigOptions {
  commandConfig: Config
  directory: string
}

export default async function pushConfig(options: PullConfigOptions): Promise<void> {
  const token = await ensureAuthenticatedPartners()
  const {remoteApp} = await ensureDevContext({...options, reset: false}, token, true)
  const apiKey = remoteApp.apiKey
  const specifications = await fetchSpecifications({token, apiKey, config: options.commandConfig})
  const app = await load({directory: options.directory, specifications})

  writeConfigurationFile({...app, configuration: {...app.configuration, applicationUrl: remoteApp.applicationUrl}})

  renderSuccess({
    headline: 'App configuration pulled',
  })
}
