import {load, tomlFilePath, writeConfigurationFile} from '../../../models/app/loader.js'
import {fetchSpecifications} from '../../generate/fetch-extension-specifications.js'
import {mergeAppConfiguration} from '../../merge-configuration.js'
import {selectOrgStoreAppEnvUpdateable} from '../../context.js'
import {setCurrentToml} from '../../local-storage.js'
import {Config} from '@oclif/core'
import {ensureAuthenticatedPartners} from '@shopify/cli-kit/node/session'
import {renderSuccess} from '@shopify/cli-kit/node/ui'
import {relativePath} from '@shopify/cli-kit/node/path'
import {fileExists} from '@shopify/cli-kit/node/fs'

export interface LinkOptions {
  commandConfig: Config
  directory: string
}

export default async function link(options: LinkOptions): Promise<void> {
  const token = await ensureAuthenticatedPartners()
  const {app: remoteApp, appEnv, useAsActiveConfig} = await selectOrgStoreAppEnvUpdateable(token, options.directory)

  const fileAlreadyExists = await fileExists(tomlFilePath(options.directory, appEnv))

  const apiKey = remoteApp.apiKey
  const specifications = await fetchSpecifications({token, apiKey, config: options.commandConfig})

  const app = await load({directory: options.directory, specifications, allowEmpty: true})
  app.configuration.remoteShopifyApp = {
    apiKey: remoteApp.apiKey,
  }

  const mergedLocalApp = mergeAppConfiguration(app, remoteApp)

  const file = writeConfigurationFile({...mergedLocalApp}, appEnv)

  setCurrentToml({
    directory: options.directory,
    toml: appEnv,
  })

  renderSuccess({
    headline: `App "${remoteApp.title}" connected to this codebase, file ${relativePath(
      mergedLocalApp.directory,
      file,
    )} ${fileAlreadyExists ? 'updated' : 'created'}`,
    body: useAsActiveConfig ? 'Now using this configuration.' : undefined,
  })
}
