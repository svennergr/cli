import {parseSchema} from 'json-schema-to-zod'
import {ZodType, ZodTypeDef, z} from 'zod'
import {writeFileSync} from './fs.js'
import {joinPath} from './path.js'
import {AbortError} from './error.js'
import {outputContent} from './output.js'
import {fetch} from './http.js'

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

export async function storeAppSchema(outputDirectory: string): Promise<NewAppSchemaResponse> {
  const schema = (await fetchAppSchema()) as NewAppSchemaResponse
  cacheSchema(schema, outputDirectory)
  return schema
}

export function cacheSchema(schema: NewAppSchemaResponse, targetPath = ''): void {
  writeFileSync(joinPath(targetPath, 'app_schema.json'), JSON.stringify(schema))
}

async function fetchAppSchema(): Promise<object> {
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  }
  const url = 'https://partners.hack-days.alfonso-noriega.eu.spin.dev/services/cli/schema/app'
  const response = await fetch(url, options)

  if (!response.ok) {
    throw new AbortError(outputContent`Couldn't fetch the app schema`)
  }

  return response.json() as object
}
