import {PartnersURLs} from './dev/urls.js'
import {AppInterface} from '../models/app/app.js'
import {OrganizationApp} from '../models/organization.js'

export function mergeAppConfiguration(
  localApp: AppInterface,
  remoteApp: Omit<OrganizationApp, 'apiSecretKeys'> & {apiSecret?: string},
): AppInterface {
  localApp.webs
    .filter((web) => web.configuration.type === 'backend')
    .map((web) => {
      web.configuration.embedded = remoteApp.embedded
      web.configuration.posEmbedded = remoteApp.posEmbedded
      web.configuration.appProxy = {
        ...web.configuration.appProxy,
        url: remoteApp.appProxy?.url,
        subPath: remoteApp.appProxy?.subPath,
        subPathPrefix: remoteApp.appProxy?.subPathPrefix,
      }
    })

  const mergedApp = mergeAppUrls(localApp, remoteApp)

  mergedApp.configuration.webhookApiVersion = remoteApp.webhookApiVersion
  mergedApp.configuration.gdprWebhooks = remoteApp.gdprWebhooks
  return mergedApp
}

export function mergeAppUrls(localApp: AppInterface, urls: PartnersURLs): AppInterface {
  localApp.webs
    .filter((web) => web.configuration.type === 'backend')
    .map((web) => {
      const authCallbackPath = urls.redirectUrlWhitelist.map((url) => {
        // const base = urls.applicationUrl.endsWith('/') ? '' : '/'
        return url.replace(urls.applicationUrl, '/')
      })
      web.configuration.urls = {
        ...web.configuration.urls,
        applicationUrl: urls.applicationUrl,
        preferencesUrl: urls.preferencesUrl,
        authCallbackPath,
      }
    })
  return localApp
}
