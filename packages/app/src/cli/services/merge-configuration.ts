import {PartnersURLs} from './dev/urls.js'
import {AppInterface} from '../models/app/app.js'
import {OrganizationApp} from '../models/organization.js'

export function mergeAppConfiguration(
  localApp: AppInterface,
  remoteApp: Omit<OrganizationApp, 'apiSecretKeys'> & {apiSecret?: string},
): AppInterface {
  const mergedApp = mergeAppUrls(localApp, remoteApp)

  mergedApp.configuration.appProxy = {
    url: remoteApp.appProxy?.url,
    subPath: remoteApp.appProxy?.subPath,
    subPathPrefix: remoteApp.appProxy?.subPathPrefix,
  }
  mergedApp.configuration.webhookApiVersion = remoteApp.webhookApiVersion
  mergedApp.configuration.gdprWebhooks = remoteApp.gdprWebhooks
  return mergedApp
}

export function mergeAppUrls(localApp: AppInterface, urls: PartnersURLs): AppInterface {
  const authCallbackPath = urls.redirectUrlWhitelist.map((url) => new URL(url).pathname)
  localApp.configuration.urls = {
    ...localApp.configuration.urls,
    applicationUrl: urls.applicationUrl,
    preferencesUrl: urls.preferencesUrl,
    authCallbackPath,
  }
  return localApp
}
