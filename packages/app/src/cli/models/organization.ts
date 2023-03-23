export interface Organization {
  id: string
  businessName: string
  website?: string
  appsNext: boolean
}

export interface MinimalOrganizationApp {
  id: string
  title: string
  apiKey: string
}

export type OrganizationApp = MinimalOrganizationApp & {
  organizationId: string
  apiSecretKeys: {
    secret: string
  }[]
  appType?: string
  newApp?: boolean
  grantedScopes: string[]
  applicationUrl: string
  redirectUrlWhitelist: string[]
  webhookApiVersion?: string
  gdprWebhooks?: {
    customerDeletionUrl?: string
    customerDataRequestUrl?: string
    shopDeletionUrl?: string
  }
  embedded?: boolean
  posEmbedded?: boolean
  preferencesUrl?: string
}

export interface OrganizationStore {
  shopId: string
  link: string
  shopDomain: string
  shopName: string
  transferDisabled: boolean
  convertableToPartnerTest: boolean
}
