import {parseSchema} from 'json-schema-to-zod'
import {ZodType, ZodTypeDef, z} from 'zod'

export {z as zod}

export interface NewAppSchemaResponse {
  definitions: {
    mySchema: object
  }
}

/**
 * Converts a JSON schema to a zod schema.
 *
 * @param schema - The JSON schema to convert to a zod schema.
 * @returns The zod schema.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function jsonToZod(schema: NewAppSchemaResponse): ZodType<any, ZodTypeDef, any> {
  const zodSchema = parseSchema(schema.definitions.mySchema)
  // eslint-disable-next-line no-eval
  return eval(zodSchema)
}
