import {
  ExtensionUpdateDraftInput,
  ExtensionUpdateDraftMutation,
  ExtensionUpdateSchema,
} from '../../api/graphql/update_draft.js'
import {parseConfigurationFile, parseConfigurationObject} from '../../models/app/loader.js'
import {ExtensionInstance} from '../../models/extensions/extension-instance.js'
import {ExtensionsArraySchema, UnifiedSchema} from '../../models/extensions/schemas.js'
import {updateAppModules} from '../dev.js'
import {AppInterface} from '../../models/app/app.js'
import {partnersRequest} from '@shopify/cli-kit/node/api/partners'
import {AbortError} from '@shopify/cli-kit/node/error'
import {readFile} from '@shopify/cli-kit/node/fs'
import {OutputMessage, outputInfo} from '@shopify/cli-kit/node/output'
import {relativizePath} from '@shopify/cli-kit/node/path'
import {decodeToml} from '@shopify/cli-kit/node/toml'
import {AdminSession} from '@shopify/cli-kit/node/session'
import {Writable} from 'stream'

interface UpdateExtensionDraftOptions {
  extension: ExtensionInstance
  token: string
  apiKey: string
  registrationId: string
  stdout: Writable
  stderr: Writable
  unifiedDeployment: boolean
}

export async function updateExtensionDraft({
  extension,
  token,
  apiKey,
  registrationId,
  stdout,
  stderr,
  unifiedDeployment,
}: UpdateExtensionDraftOptions) {
  let encodedFile: string | undefined
  if (extension.features.includes('esbuild')) {
    const content = await readFile(extension.outputPath)
    if (!content) return
    encodedFile = Buffer.from(content).toString('base64')
  }

  const configValue = (await extension.deployConfig({apiKey, token, unifiedDeployment})) || {}
  const {handle, ...remainingConfigs} = configValue
  const extensionInput: ExtensionUpdateDraftInput = {
    apiKey,
    config: JSON.stringify({
      ...remainingConfigs,
      serialized_script: encodedFile,
    }),
    context: handle as string,
    registrationId,
  }
  const mutation = ExtensionUpdateDraftMutation

  const mutationResult: ExtensionUpdateSchema = await partnersRequest(mutation, token, extensionInput)
  if (mutationResult.extensionUpdateDraft?.userErrors?.length > 0) {
    const errors = mutationResult.extensionUpdateDraft.userErrors.map((error) => error.message).join(', ')
    stderr.write(`Error while updating drafts: ${errors}`)
  } else {
    outputInfo(`Draft updated successfully for extension: ${extension.localIdentifier}`, stdout)
  }
}

interface UpdateExtensionConfigOptions {
  app: AppInterface
  extension: ExtensionInstance
  adminSession: AdminSession
  token: string
  apiKey: string
  registrationId: string
  stdout: Writable
  stderr: Writable
  unifiedDeployment: boolean
}

export async function updateExtensionConfig({
  app,
  extension,
  token,
  adminSession,
  apiKey,
  registrationId,
  stdout,
  stderr,
  unifiedDeployment,
}: UpdateExtensionConfigOptions) {
  const abort = (errorMessage: OutputMessage) => {
    stdout.write(errorMessage)
    throw new AbortError(errorMessage)
  }

  const fileContent = await readFile(extension.configurationPath)
  let configObject = decodeToml(fileContent)
  const {extensions} = ExtensionsArraySchema.parse(configObject)

  if (extensions) {
    // If the config has an array, find our extension using the handle.
    const configuration = await parseConfigurationFile(UnifiedSchema, extension.configurationPath, abort)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extensionConfig = configuration.extensions.find((config: any) => config.handle === extension.handle)
    if (!extensionConfig) {
      abort(
        `ERROR: Invalid handle
  - Expected handle: "${extension.handle}"
  - Configuration file path: ${relativizePath(extension.configurationPath)}.
  - Handles are immutable, you can't change them once they are set.`,
      )
    }

    configObject = {...configuration, ...extensionConfig}
  }

  const newConfig = await parseConfigurationObject(
    extension.specification.schema,
    extension.configurationPath,
    configObject,
    abort,
  )

  // eslint-disable-next-line require-atomic-updates
  extension.configuration = newConfig
  return updateAppModules({app, extensions: [extension], adminSession, token, apiKey})

  // return updateExtensionDraft({extension, token, apiKey, registrationId, stdout, stderr, unifiedDeployment})
}
