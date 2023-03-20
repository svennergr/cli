import {fetchSpecifications} from '../generate/fetch-extension-specifications.js'
import {load, writeConfigurationFile} from '../../models/app/loader.js'
import {AppConfiguration} from '../../models/app/app.js'
import {AppUpdateMutation, AppUpdateMutationSchema, AppUpdateMutationVariables} from '../../api/graphql/app_update.js'
import {ensureDevContext} from '../context.js'
import {OrganizationApp} from '../../models/organization.js'
import {ensureAuthenticatedPartners} from '@shopify/cli-kit/node/session'
import {Config} from '@oclif/core'
import {AbortError} from '@shopify/cli-kit/node/error'
import {partnersRequest} from '@shopify/cli-kit/node/api/partners'
import {renderSuccess, renderWarning} from '@shopify/cli-kit/node/ui'

export interface PushConfigOptions {
  commandConfig: Config
  directory: string
}

interface UpdatedApp {
  applicationUrl: string
  redirectUrlWhitelist: string[]
}

export default async function pushConfig(options: PushConfigOptions): Promise<void> {
  const token = await ensureAuthenticatedPartners()
  const {remoteApp} = await ensureDevContext({...options, reset: false}, token, true)
  const apiKey = remoteApp.apiKey
  const specifications = await fetchSpecifications({token, apiKey, config: options.commandConfig})
  const app = await load({directory: options.directory, specifications})

  printDiff(app.configuration, remoteApp)

  const updatedApp = await pushToPartners(app.configuration, apiKey, token)

  app.configuration = {...app.configuration, ...updatedApp}
  writeConfigurationFile(app)

  printResult(app.configuration)
}

async function pushToPartners(config: AppConfiguration, apiKey: string, token: string): Promise<UpdatedApp> {
  const variables: AppUpdateMutationVariables = {
    apiKey,
    applicationUrl: config.applicationUrl || '',
    redirectUrlWhitelist: config.redirectUrlWhitelist || [],
    webhookApiVersion: config.webhookApiVersion,
  }
  const query = AppUpdateMutation
  const result: AppUpdateMutationSchema = await partnersRequest(query, token, variables)
  if (result.appUpdate.userErrors.length > 0) {
    const errors = result.appUpdate.userErrors.map((error) => error.message).join(', ')
    throw new AbortError(errors)
  }
  return result.appUpdate.app
}

function printDiff(
  config: AppConfiguration,
  remoteConfig: Omit<OrganizationApp, 'apiSecretKeys'> & {apiSecret?: string | undefined},
): void {
  const remoteItems = []
  const localItems = []

  // TODO: do this smartly
  if (config.applicationUrl !== remoteConfig.applicationUrl) {
    remoteItems.push(`App URL:                     ${remoteConfig.applicationUrl}`)
    localItems.push(`App URL:                     ${config.applicationUrl}`)
  }
  if (config.redirectUrlWhitelist?.toString() !== remoteConfig.redirectUrlWhitelist.toString()) {
    remoteItems.push(
      `Allowed redirection URL(s):\n${remoteConfig.redirectUrlWhitelist
        .map((url) => `                             ${url}`)
        .join('\n')}`,
    )
    localItems.push(
      `Allowed redirection URL(s):\n${(config.redirectUrlWhitelist || [])
        .map((url) => `                             ${url}`)
        .join('\n')}`,
    )
  }
  if (config.webhookApiVersion !== remoteConfig.webhookApiVersion) {
    remoteItems.push(`Webhook API Version:         ${remoteConfig.webhookApiVersion}`)
    localItems.push(`Webhook API Version:         ${config.webhookApiVersion}`)
  }

  if (remoteItems.length === 0) return
  renderWarning({
    headline: 'Some of your app’s local configurations are different than they are on Shopify',
    customSections: [
      {title: 'The configurations on Shopify are', body: {list: {items: remoteItems}}},
      {title: 'Your local configurations are', body: {list: {items: localItems}}},
    ],
  })
}

function printResult(config: AppConfiguration): void {
  renderSuccess({
    headline: 'App configuration updated',
    customSections: [
      {title: 'App URL', body: {list: {items: [config.applicationUrl || '']}}},
      {title: 'Allowed redirection URL(s)', body: {list: {items: config.redirectUrlWhitelist || []}}},
    ],
  })
}
