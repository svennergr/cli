import {BaseFunctionConfigurationSchema} from './schemas.js'
import {FunctionExtension} from '../app/extensions.js'
import {constantize} from '@shopify/cli-kit/common/string'
import {partnersFqdn} from '@shopify/cli-kit/node/context/fqdn'
import {joinPath, basename} from '@shopify/cli-kit/node/path'
import {zod} from '@shopify/cli-kit/node/schema'

// Base config type that all config schemas must extend
export type FunctionConfigType = zod.infer<typeof BaseFunctionConfigurationSchema>

/**
 * Class that represents an instance of a local function
 * Before creating this class we've validated that:
 * - There is a spec for this type of function
 * - The Config Schema for that spec is followed by the function config toml file
 *
 * This class holds the public interface to interact with functions
 */
export class FunctionInstance<TConfiguration extends FunctionConfigType = FunctionConfigType>
  implements FunctionExtension
{
  idEnvironmentVariableName: string
  localIdentifier: string
  directory: string
  entrySourceFilePath?: string
  configuration: TConfiguration
  configurationPath: string

  constructor(options: {
    configuration: TConfiguration
    configurationPath: string
    directory: string
    entryPath?: string
  }) {
    this.configuration = options.configuration
    this.configurationPath = options.configurationPath
    this.directory = options.directory
    this.entrySourceFilePath = options.entryPath
    this.localIdentifier = basename(options.directory)
    this.idEnvironmentVariableName = `SHOPIFY_${constantize(basename(this.directory))}_ID`
  }

  get graphQLType() {
    return this.configuration.type.toUpperCase()
  }

  get type() {
    return this.configuration.type
  }

  get identifier() {
    return this.configuration.type
  }

  get externalType() {
    return this.configuration.type
  }

  get name() {
    return this.configuration.name
  }

  get buildCommand() {
    return this.configuration.build.command
  }

  get inputQueryPath() {
    return joinPath(this.directory, 'input.graphql')
  }

  get buildWasmPath() {
    const relativePath = this.configuration.build.path ?? joinPath('dist', 'index.wasm')
    return joinPath(this.directory, relativePath)
  }

  get isJavaScript() {
    return Boolean(this.entrySourceFilePath?.endsWith('.js') || this.entrySourceFilePath?.endsWith('.ts'))
  }

  async publishURL(options: {orgId: string; appId: string}) {
    const fqdn = await partnersFqdn()
    return `https://${fqdn}/${options.orgId}/apps/${options.appId}/extensions`
  }
}
