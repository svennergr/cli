import {BaseFunctionConfigurationSchema, BaseFunctionMetadataSchema, TypeSchema} from './schemas'
import {toml, schema, file, path, error, system, abort, string} from '@shopify/cli-kit'
import {err, ok, Result} from '@shopify/cli-kit/common/result'
import {fqdn} from '@shopify/cli-kit/src/environment.js'
import {Writable} from 'stream'

// Base config types that all config schemas must extend
type FunctionConfigType = schema.define.infer<typeof BaseFunctionConfigurationSchema>
type MetadataType = schema.define.infer<typeof BaseFunctionMetadataSchema>

// Array with all registered functions
const AllSpecs: FunctionSpec[] = []
type LoadFunctionError = 'invalid_function_type' | 'invalid_function_config' | 'invalid_function_metadata'

/**
 * Specification with all the needed properties and methods to load a function.
 */
export interface FunctionSpec<
  TConfiguration extends FunctionConfigType = FunctionConfigType,
  TMetadata extends MetadataType = MetadataType,
> {
  identifier: string
  externalType: string
  externalName: string
  helpURL?: string
  public?: boolean
  templateURL?: string
  languages?: {name: string; value: string}[]
  configSchema?: schema.define.ZodType<TConfiguration>
  metadataSchema?: schema.define.ZodType<TMetadata>
  templatePath: (lang: string) => string
  validate?: <T extends TConfiguration>(config: T) => unknown
}

/**
 * Class that represents an instance of a local function
 * Before creating this class we've validated that:
 * - There is a spec for this type of function
 * - The Config Schema for that spec is followed by the function config toml file
 * - The Metadata Schema for that spec is followed by the function metadata file
 *
 * This class holds the public interface to interact with functions
 */
export class FunctionInstance<
  TConfiguration extends FunctionConfigType = FunctionConfigType,
  TMetadata extends MetadataType = MetadataType,
> {
  idEnvironmentVariableName: string
  localIdentifier: string
  directory: string
  configuration: TConfiguration
  configurationPath: string

  private metadata: TMetadata
  private specification: FunctionSpec<TConfiguration>

  get type() {
    return this.specification.identifier
  }

  get name() {
    return this.configuration.name
  }

  constructor(
    configuration: TConfiguration,
    configurationPath: string,
    metadata: TMetadata,
    specification: FunctionSpec<TConfiguration>,
    directory: string,
  ) {
    this.configuration = configuration
    this.configurationPath = configurationPath
    this.metadata = metadata
    this.specification = specification
    this.directory = directory
    this.localIdentifier = path.basename(directory)
    this.idEnvironmentVariableName = `SHOPIFY_${string.constantize(path.basename(this.directory))}_ID`
  }

  get inputQueryPath() {
    return `${this.directory}/input.graphql`
  }

  get wasmPath() {
    const relativePath = this.configuration.build.path ?? 'dist/index.wasm'
    return `${this.directory}/${relativePath}`
  }

  validate() {
    return this.specification.validate?.(this.configuration)
  }

  async build(stdout: Writable, stderr: Writable, signal: abort.Signal) {
    const buildCommand = this.configuration.build.command
    if (!buildCommand || buildCommand.trim() === '') {
      stderr.write(`The function extension ${this.localIdentifier} doesn't have a build command or it's empty`)
      stderr.write(`
      Edit the shopify.function.extension.toml configuration file and set how to build the extension.

      [build]
      command = "{COMMAND}"

      Note that the command must output a dist/index.wasm file.
      `)
      throw new error.AbortSilent()
    }
    const buildCommandComponents = buildCommand.split(' ')
    stdout.write(`Building function ${this.localIdentifier}...`)
    await system.exec(buildCommandComponents[0]!, buildCommandComponents.slice(1), {
      stdout,
      stderr,
      cwd: this.directory,
      signal,
    })
  }

  async publishURL(options: {orgId: string; appId: string}) {
    const partnersFqdn = await fqdn.partners()
    return `https://${partnersFqdn}/${options.orgId}/apps/${options.appId}/extensions`
  }
}

/**
 * Find the registered spec for a given function type
 */
function specForType(type: string): FunctionSpec | undefined {
  return AllSpecs.find((spec) => spec.identifier === type)
}

/**
 * Given a path, read the type first, find the correct spec and load the function.
 *
 * If there is no spec for that type, return undefined.
 * Loading the function can fail if the config fail doesn't follow the given Schema
 */
export async function loadFunction(configPath: string): Promise<Result<FunctionInstance, LoadFunctionError>> {
  const directory = path.dirname(configPath)

  // Read Config file
  const fileContent = await file.read(configPath)
  const obj = toml.decode(fileContent)

  // Find spec for the current function type
  const {type} = TypeSchema.parse(obj)
  const spec = specForType(type)
  if (!spec) return err('invalid_function_type')

  // Parse Config file
  let config
  try {
    config = (spec.configSchema ?? BaseFunctionConfigurationSchema).parse(obj)
    // eslint-disable-next-line no-catch-all/no-catch-all
  } catch {
    return err('invalid_function_config')
  }

  // Parse Metadata file
  let metadata
  try {
    const fileContent = await file.read(path.join(directory, 'metadata.json'))
    const jsonObj = JSON.parse(fileContent)
    metadata = (spec.metadataSchema ?? BaseFunctionMetadataSchema).parse(jsonObj)
    // eslint-disable-next-line no-catch-all/no-catch-all
  } catch {
    return err('invalid_function_metadata')
  }

  const instance = new FunctionInstance(config, configPath, metadata, spec, directory)
  return ok(instance)
}

export function createFunctionSpec<
  TConfiguration extends FunctionConfigType = FunctionConfigType,
  TMetadata extends MetadataType = MetadataType,
>(spec: FunctionSpec<TConfiguration, TMetadata>): FunctionSpec<TConfiguration, TMetadata> {
  const defaults = {
    templateURL: 'https://github.com/Shopify/function-examples',
    languages: [
      {name: 'Wasm', value: 'wasm'},
      {name: 'Rust', value: 'rust'},
    ],
    public: true,
  }
  return {...defaults, ...spec}
}
