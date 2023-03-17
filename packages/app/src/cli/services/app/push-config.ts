import {selectApp} from './select-app.js'
import {fetchSpecifications} from '../generate/fetch-extension-specifications.js'
import {load} from '../../models/app/loader.js'
import {AppConfiguration} from '../../models/app/app.js'
import {AppUpdateMutation, AppUpdateMutationSchema, AppUpdateMutationVariables} from '../../api/graphql/app_update.js'
import {ensureAuthenticatedPartners} from '@shopify/cli-kit/node/session'
import {Config} from '@oclif/core'
import {AbortError} from '@shopify/cli-kit/node/error'
import {partnersRequest} from '@shopify/cli-kit/node/api/partners'
import {renderSuccess} from '@shopify/cli-kit/node/ui'

export interface PushConfigOptions {
  apiKey?: string
  commandConfig: Config
  directory: string
}

export default async function pushConfig(options: PushConfigOptions): Promise<void> {
  const token = await ensureAuthenticatedPartners()
  const apiKey = options.apiKey || (await selectApp()).apiKey
  const specifications = await fetchSpecifications({token, apiKey, config: options.commandConfig})
  const app = await load({directory: options.directory, specifications})

  await pushToPartners(app.configuration, apiKey, token)
  printResult(app.configuration)
}

async function pushToPartners(config: AppConfiguration, apiKey: string, token: string): Promise<void> {
  const variables: AppUpdateMutationVariables = {
    apiKey,
    applicationUrl: config.applicationUrl || '',
    redirectUrlWhitelist: config.redirectUrlWhitelist || [],
  }
  const query = AppUpdateMutation
  const result: AppUpdateMutationSchema = await partnersRequest(query, token, variables)
  if (result.appUpdate.userErrors.length > 0) {
    const errors = result.appUpdate.userErrors.map((error) => error.message).join(', ')
    throw new AbortError(errors)
  }
}

// async function getNewURLs(token: string, apiKey: string, options: URLs): Promise<PartnersURLs> {
//   const currentURLs: PartnersURLs = await getURLs(apiKey, token)
//   const newURLs: PartnersURLs = {
//     applicationUrl: options.appURL || (await appUrlPrompt(currentURLs.applicationUrl)),
//     redirectUrlWhitelist:
//       options.redirectURLs || (await allowedRedirectionURLsPrompt(currentURLs.redirectUrlWhitelist.join(','))),
//   }
//   validatePartnersURLs(newURLs)
//   return newURLs
// }

function printResult(config: AppConfiguration): void {
  renderSuccess({
    headline: 'App configuration updated',
    customSections: [
      {title: 'App URL', body: {list: {items: [config.applicationUrl || '']}}},
      {title: 'Allowed redirection URL(s)', body: {list: {items: config.redirectUrlWhitelist || []}}},
    ],
  })
}
