import {gql} from 'graphql-request'

export const AppUpdateMutation = gql`
  mutation appUpdate(
    $apiKey: String!
    $applicationUrl: Url!
    $redirectUrlWhitelist: [Url]!
    $appProxy: AppProxyInput
    $gdprWebhooksCustomerDeletionUrl: Url
    $gdprWebhooksCustomerDataRequestUrl: Url
    $gdprWebhooksShopDeletionUrl: Url
    $embedded: Boolean
    $posEmbedded: Boolean
  ) {
    appUpdate(
      input: {
        apiKey: $apiKey
        applicationUrl: $applicationUrl
        redirectUrlWhitelist: $redirectUrlWhitelist
        appProxy: $appProxy
        gdprWebhooks: {
          customerDeletionUrl: $gdprWebhooksCustomerDeletionUrl
          customerDataRequestUrl: $gdprWebhooksCustomerDataRequestUrl
          shopDeletionUrl: $gdprWebhooksShopDeletionUrl
        }
        embedded: $embedded
        posEmbedded: $posEmbedded
      }
    ) {
      app {
        applicationUrl
        redirectUrlWhitelist
        embedded
        posEmbedded
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
  redirectUrlWhitelist: string[]
  appProxy?: {
    proxyUrl: string
    proxySubPath: string
    proxySubPathPrefix: string
  }
  gdprWebhooksCustomerDeletionUrl?: string
  gdprWebhooksCustomerDataRequestUrl?: string
  gdprWebhooksShopDeletionUrl?: string
  embedded?: boolean
  posEmbedded?: boolean
}

export interface AppUpdateMutationSchema {
  appUpdate: {
    app: {
      applicationUrl: string
      redirectUrlWhitelist: string[]
      embedded: boolean
      posEmbedded: boolean
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
