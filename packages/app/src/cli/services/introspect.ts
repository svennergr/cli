import {partnersRequest} from '@shopify/cli-kit/node/api/partners'
import {ensureAuthenticatedPartners} from '@shopify/cli-kit/node/session'
import {gql} from 'graphql-request'
import {
    buildClientSchema,
    IntrospectionQuery
  } from "graphql";

export const query = gql`
    query IntrospectionQuery {
        __schema {
        queryType { name }
        mutationType { name }
        types {
            ...FullType
        }
        directives {
            name
            description
            locations
            args {
            ...InputValue
            }
        }
        }
    }

    fragment FullType on __Type {
    kind
    name
    description
    fields(includeDeprecated: true) {
      name
      description
      args {
        ...InputValue
      }
      type {
        ...TypeRef
      }
      isDeprecated
      deprecationReason
    }
    inputFields {
      ...InputValue
    }
    interfaces {
      ...TypeRef
    }
    enumValues(includeDeprecated: true) {
      name
      description
      isDeprecated
      deprecationReason
    }
    possibleTypes {
      ...TypeRef
    }
  }
  fragment InputValue on __InputValue {
    name
    description
    type { ...TypeRef }
    defaultValue
  }
  fragment TypeRef on __Type {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
              ofType {
                kind
                name
                ofType {
                  kind
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`

async function introspect(args: any) {
    const token = await ensureAuthenticatedPartners()
    const result = await partnersRequest(query, token)

    console.log('client schema', buildClientSchema(result as IntrospectionQuery))
}

export default introspect
