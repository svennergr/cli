import {selectApp} from './select-app.js'
import {getURLs, PartnersURLs, updateURLs, validatePartnersURLs} from '../dev/urls.js'
import {allowedRedirectionURLsPrompt, appUrlPrompt} from '../../prompts/update-url.js'
import {fetchSpecifications} from '../generate/fetch-extension-specifications.js'
import {load} from '../../models/app/loader.js'
import {ensureAuthenticatedPartners} from '@shopify/cli-kit/node/session'
import {renderSuccess} from '@shopify/cli-kit/node/ui'
import {Config} from '@oclif/core'

export interface URLs {
  appURL?: string
  redirectURLs?: string[]
}

export interface UpdateURLOptions extends URLs {
  apiKey?: string
  commandConfig: Config
  directory: string
}

export default async function updateURL(options: UpdateURLOptions): Promise<void> {
  const token = await ensureAuthenticatedPartners()
  const apiKey = options.apiKey || (await selectApp()).apiKey
  const specifications = await fetchSpecifications({token, apiKey, config: options.commandConfig})
  const app = await load({directory: options.directory, specifications})

  const newURLs = await getNewURLs(token, apiKey, {appURL: options.appURL, redirectURLs: options.redirectURLs})
  await updateURLs(app, newURLs, apiKey, token)
  printResult(newURLs)
}

async function getNewURLs(token: string, apiKey: string, options: URLs): Promise<PartnersURLs> {
  const currentURLs: PartnersURLs = await getURLs(apiKey, token)
  const newURLs: PartnersURLs = {
    applicationUrl: options.appURL || (await appUrlPrompt(currentURLs.applicationUrl)),
    redirectUrlWhitelist:
      options.redirectURLs || (await allowedRedirectionURLsPrompt(currentURLs.redirectUrlWhitelist.join(','))),
  }
  validatePartnersURLs(newURLs)
  return newURLs
}

function printResult(urls: PartnersURLs): void {
  renderSuccess({
    headline: 'App URLs updated',
    customSections: [
      {title: 'App URL', body: {list: {items: [urls.applicationUrl]}}},
      {title: 'Allowed redirection URL(s)', body: {list: {items: urls.redirectUrlWhitelist}}},
    ],
  })
}
