import {gql} from 'graphql-request'

export const AppUpdateMutation = gql`
  mutation appUpdate($apiKey: String!, $applicationUrl: Url!, $redirectUrlWhitelist: [Url]!) {
    appUpdate(input: {apiKey: $apiKey, applicationUrl: $applicationUrl, redirectUrlWhitelist: $redirectUrlWhitelist}) {
      app {
        applicationUrl
        redirectUrlWhitelist
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
}

export interface AppUpdateMutationSchema {
  appUpdate: {
    app: {
      applicationUrl: string
      redirectUrlWhitelist: string[]
    }
    userErrors: {
      field: string[]
      message: string
    }[]
  }
}
