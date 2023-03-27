import {gql} from 'graphql-request'

export const AppUpdateMutation = gql`
  mutation appUpdate(
    $apiKey: String!
    $applicationUrl: Url!
    $redirectUrlWhitelist: [Url]
    $webhookApiVersion: String
    $appProxy: AppProxyInput
    $preferencesUrl: Url
    $gdprWebhooksCustomerDeletionUrl: Url
    $gdprWebhooksCustomerDataRequestUrl: Url
    $gdprWebhooksShopDeletionUrl: Url
  ) {
    appUpdate(
      input: {
        apiKey: $apiKey
        applicationUrl: $applicationUrl
        preferencesUrl: $preferencesUrl
        redirectUrlWhitelist: $redirectUrlWhitelist
        webhookApiVersion: $webhookApiVersion
        appProxy: $appProxy
        gdprWebhooks: {
          customerDeletionUrl: $gdprWebhooksCustomerDeletionUrl
          customerDataRequestUrl: $gdprWebhooksCustomerDataRequestUrl
          shopDeletionUrl: $gdprWebhooksShopDeletionUrl
        }
      }
    ) {
      app {
        id
        title
        apiKey
        organizationId
        grantedScopes
        webhookApiVersion
        applicationUrl
        redirectUrlWhitelist
        preferencesUrl
        appProxy {
          url
          subPath
          subPathPrefix
        }
        gdprWebhooks {
          customerDeletionUrl
          customerDataRequestUrl
          shopDeletionUrl
        }
      }
      userErrors {
        message
        field
      }
    }
  }
`

export interface AppUpdateMutationVariables {
  apiKey: string
  applicationUrl: string
  preferencesUrl?: string
  redirectUrlWhitelist?: string[]
  webhookApiVersion?: string
  appProxy?: {
    proxyUrl: string
    proxySubPath: string
    proxySubPathPrefix: string
  }
  gdprWebhooksCustomerDeletionUrl?: string
  gdprWebhooksCustomerDataRequestUrl?: string
  gdprWebhooksShopDeletionUrl?: string
}

export interface AppUpdateMutationSchema {
  appUpdate: {
    app: {
      id: string
      title: string
      apiKey: string
      organizationId: string
      grantedScopes: string[]
      webhookApiVersion?: string
      applicationUrl: string
      redirectUrlWhitelist: string[]
      preferencesUrl?: string
      appProxy: {
        url: string
        subPath: string
        subPathPrefix: string
      }
      gdprWebhooks: {
        customerDeletionUrl: string
        customerDataRequestUrl: string
        shopDeletionUrl: string
      }
    }
    userErrors: {
      field: string[]
      message: string
    }[]
  }
}
