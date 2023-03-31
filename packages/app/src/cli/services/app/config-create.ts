import {ensureDevContext} from '../context.js'
import {load, writeConfigurationFile} from '../../models/app/loader.js'
import {fetchSpecifications} from '../generate/fetch-extension-specifications.js'
import {configurationFileNames} from '../../constants.js'
import {mergeAppConfiguration} from '../merge-configuration.js'
import {Config} from '@oclif/core'
import {ensureAuthenticatedPartners} from '@shopify/cli-kit/node/session'
import {renderSuccess} from '@shopify/cli-kit/node/ui'
import {fileExists, writeFileSync} from '@shopify/cli-kit/node/fs'

export interface ConfigCreateOptions {
  commandConfig: Config
  directory: string
}

export default async function configCreate(options: ConfigCreateOptions): Promise<void> {
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

  const mergedLocalApp = mergeAppConfiguration(app, remoteApp)

  writeConfigurationFile({...mergedLocalApp})

  renderSuccess({
    headline: 'App configuration pulled',
  })
}
