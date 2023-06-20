import {PushConfig, PushConfigSchema} from '../../../api/graphql/push_config.js'
import {parseConfigurationFile} from '../../../models/app/loader.js'
import {AppConfigurationSchema, AppInterface} from '../../../models/app/app.js'
import {ensureAuthenticatedPartners} from '@shopify/cli-kit/node/session'
import {partnersRequest} from '@shopify/cli-kit/node/api/partners'
import {AbortError} from '@shopify/cli-kit/node/error'
import {renderSuccess} from '@shopify/cli-kit/node/ui'
import {OutputMessage} from '@shopify/cli-kit/node/output'
import {relativePath} from '@shopify/cli-kit/node/path'

export interface Options {
  apiKey: string
  app: AppInterface
}

export async function pushConfig(options: Options) {
  const token = await ensureAuthenticatedPartners()
  // const apiKey = options.apiKey || (await selectApp()).apiKey
  const mutation = PushConfig

  const configuration = await parseConfigurationFile(AppConfigurationSchema, options.app.configurationPath, abort)
  const variables = {apiKey: configuration.clientId, ...configuration}
  const result: PushConfigSchema = await partnersRequest(mutation, token, variables)

  if (result.appUpdate.userErrors.length > 0) {
    const errors = result.appUpdate.userErrors.map((error) => error.message).join(', ')
    abort(errors)
  }

  const configFileName = relativePath(options.app.directory, options.app.configurationPath)

  renderSuccess({
    headline: `Updated app configuration for ${options.app.configuration.name}`,
    body: [`${configFileName} configuration is now live on Shopify.`],
  })
}

const abort = (errorMessage: OutputMessage) => {
  throw new AbortError(errorMessage)
}
