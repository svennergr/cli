import {partnersRequest} from '@shopify/cli-kit/node/api/partners'
import {ensureAuthenticatedPartners} from '@shopify/cli-kit/node/session'
import {gql} from 'graphql-request'
import {
    generateFieldsAndVarsForMutation,
    loc,
    getName,
    getDocumentDefinition
} from './helpers.js'
import {
    buildClientSchema,
    IntrospectionQuery,
    printSchema,
    buildSchema,
    Source,
    Kind,
    OperationTypeNode,
    print
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

    const clientSchema = buildClientSchema(result as IntrospectionQuery)

    // doing this set of transforms gives you the GraphQLSchema shape with the AST built (instead of just GraphQLSchema),
    // which is useful for traversal
    const schemaLanguage = printSchema(clientSchema);
    const source = new Source(schemaLanguage);
    const validSchema = buildSchema(source, { assumeValidSDL: true });

    const mutationRootAst = validSchema.getMutationType()!.astNode!
    const mutations = mutationRootAst.fields!

    const mutationDocuments = mutations.map((mutation) => {
        const mutationInfo = {
            name: mutation.name.value,
            description: mutation.description,
            args: mutation.arguments,
          };

        const { selections, variableDefinitionsMap } =
            generateFieldsAndVarsForMutation({ node: mutation, schema: validSchema });

            const selectionSet = {
                kind: Kind.SELECTION_SET,
                selections,
              };

              const document = {
                kind: Kind.OPERATION_DEFINITION,
                operation: "mutation" as OperationTypeNode,
                selectionSet,
                variableDefinitions: Object.values(variableDefinitionsMap),
                loc,
                name: getName(mutation?.name?.value),
              };

            const definitions = [document];
            const mutationDocument = getDocumentDefinition(definitions);


            const printedDocument = print(mutationDocument);
            console.log({printedDocument})


            return {
                mutationInfo,
                mutationDocument,
            };
    })

}

export default introspect
