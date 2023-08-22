import {gql} from 'graphql-request'

export const PushConfig = gql`
  mutation appUpdate(
    $title: String!
    $apiKey: String!
    $applicationUrl: Url
    $redirectUrlAllowlist: [Url]
    $requestedAccessScopes: [String!]
    $webhookApiVersion: String!
    $gdprWebhooks: GdprWebhooksInput
    $appProxy: AppProxyInput
    $posEmbedded: Boolean
    $embedded: Boolean
    $preferencesUrl: Url
    $webhookSubscriptions: [WebhookSubscriptionsInput!]
  ) {
    appUpdate(
      input: {
        title: $title
        apiKey: $apiKey
        applicationUrl: $applicationUrl
        redirectUrlWhitelist: $redirectUrlAllowlist
        requestedAccessScopes: $requestedAccessScopes
        webhookApiVersion: $webhookApiVersion
        gdprWebhooks: $gdprWebhooks
        appProxy: $appProxy
        posEmbedded: $posEmbedded
        embedded: $embedded
        preferencesUrl: $preferencesUrl
        webhookSubscriptions: $webhookSubscriptions
      }
    ) {
      userErrors {
        message
        field
      }
    }
  }
`

interface GdprWebhooks {
  customerDeletionUrl?: string
  customerDataRequestUrl?: string
  shopDeletionUrl?: string
}

interface AppProxy {
  proxyUrl: string
  proxySubPath: string
  proxySubPathPrefix: string
}

export interface WebhookSubscription {
  callbackUrl: string
  topic: string
}

export interface PushConfigVariables {
  title: string
  apiKey: string
  applicationUrl?: string
  redirectUrlAllowlist?: string[] | null
  requestedAccessScopes?: string[]
  webhookApiVersion?: string
  gdprWebhooks?: GdprWebhooks
  appProxy?: AppProxy
  posEmbedded?: boolean
  embedded?: boolean
  preferencesUrl?: string | null
  webhookSubscriptions?: WebhookSubscription[] | null
}

export interface PushConfigSchema {
  appUpdate: {
    userErrors: {
      field: string[]
      message: string
    }[]
  }
}
