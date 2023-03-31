import {ensureDevContext} from '../context.js'
import {load} from '../../models/app/loader.js'
import {fetchSpecifications} from '../generate/fetch-extension-specifications.js'
import {configurationFileNames} from '../../constants.js'
import {createApp} from '../dev/select-app.js'
import {fetchOrgFromId} from '../dev/fetch.js'
import {Config} from '@oclif/core'
import {ensureAuthenticatedPartners} from '@shopify/cli-kit/node/session'
import {renderSuccess} from '@shopify/cli-kit/node/ui'
import {fileExists, writeFileSync} from '@shopify/cli-kit/node/fs'
import {encodeToml} from '@shopify/cli-kit/node/toml'

export interface ConfigCreateOptions {
  commandConfig: Config
  directory: string
  name: string
}

export default async function configCreate(options: ConfigCreateOptions): Promise<void> {
  const newConfigfile = `${options.directory}/shopify.app.${options.name}.toml`
  const configPath = `${options.directory}/${configurationFileNames.app}`
  const configExists = await fileExists(configPath)

  if (!configExists) {
    throw new Error("Main App TOML doesn't exist")
  }

  const token = await ensureAuthenticatedPartners()
  const {remoteApp} = await ensureDevContext({...options, reset: false}, token, true)
  const apiKey = remoteApp.apiKey
  const specifications = await fetchSpecifications({token, apiKey, config: options.commandConfig})
  const app = await load({directory: options.directory, specifications})

  writeFileSync(newConfigfile, encodeToml(app.configuration))

  const org = await fetchOrgFromId(remoteApp.organizationId, token)

  await createApp(org, options.name, token)

  renderSuccess({
    headline: 'App configuration pulled',
  })
}
