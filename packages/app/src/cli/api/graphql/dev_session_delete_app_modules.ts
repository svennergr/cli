import {gql} from 'graphql-request'

export const DevSessionDeleteAppModulesMutation = gql`
  mutation devSessionDeleteAppModules($apiKey: String!, $moduleUuidsToDelete: [String!]) {
    devSessionDeleteAppModules(apiKey: $apiKey, moduleUuidsToDelete: $moduleUuidsToDelete) {
      deleted_uuids
    }
  }
`

export interface DevSessionDeleteAppModulesVariables {
  apiKey: string
  appModules: string[]
}

export interface DevSessionUpdateSchema {
  deletedUuids: string[]
}
