import {gql} from 'graphql-request'

export const DevSessionDeleteMutation = gql`
  mutation devSessionDelete($id: ID!) {
    devSessionDelete(id: $id) {
      deletedAppId
      userErrors {
        field
        message
      }
    }
  }
`

export interface DevSessionUpdateVariables {
  id: string
}

export interface DevSessionUpdateSchema {
  deletedAppId: string
  userErrors: {
    field: string[]
    message: string
  }[]
}
