// import {createUIExtensionSpecification} from '../ui.js'
import {BaseSchema} from '../schemas.js'
import {createExtensionSpecification} from '../specification.js'
import {loadLocalesConfig} from '../../../utilities/extensions/locales-configuration.js'
import {joinPath} from '@shopify/cli-kit/node/path'
import {zod} from '@shopify/cli-kit/node/schema'
import {AbortError} from '@shopify/cli-kit/node/error'
import {glob} from '@shopify/cli-kit/node/fs'
import fs from 'fs'

const FlowTemplateExtensionSchema = BaseSchema.extend({
  name: zod.string(),
  description: zod.string(),
  extensions: zod.array(
    zod.object({
      handle: zod.string(),
      type: zod.literal('flow_template'),
      title: zod.string(),
      description: zod.string(),
      categories: zod.array(zod.string()),
      pre_install_note: zod.string().optional(),
      post_install_note: zod.string().optional(),
    }),
  ),
})

const spec = createExtensionSpecification({
  identifier: 'flow_template',
  schema: FlowTemplateExtensionSchema,
  singleEntryPath: false,
  appModuleFeatures: (_) => [],
  deployConfig: async (config, directory) => {
    // supporting one extension for now in implementation
    const extension = config.extensions[0]
    if (!extension) {
      throw new AbortError(`Missing extension in ${directory} `, 'Make sure you have defined at least one extension.')
    }
    if (config.extensions.length > 1) {
      throw new AbortError(
        `More than one extension found in ${directory} `,
        'Make sure you have only one extension defined. This will be expanded to support more in the future.',
      )
    }
    const c = {
      handle: extension.handle,
      title: extension.title,
      description: extension.description,
      categories: extension.categories,
      pre_install_note: extension.pre_install_note,
      post_install_note: extension.post_install_note,
      localization: await loadLocalesConfig(directory, 'flow_template'),
      definition: await loadWorkflow(directory),
    }
    console.log(c)
    return c
  },
})

async function loadWorkflow(path: string) {
  const flowFilePaths = await glob(joinPath(path, '*.flow'))

  if (flowFilePaths.length === 0) {
    throw new AbortError(
      `Missing .flow file in ${path} `,
      'Make sure you have built and exported a flow file from a Shop.',
    )
  } else if (flowFilePaths.length > 1) {
    throw new AbortError(
      `More than one .flow file found in ${path} `,
      'Make sure you have only one .flow file in your extension folder.',
    )
  }

  const flowFilePath = flowFilePaths[0]
  if (flowFilePath) {
    return fs.readFileSync(flowFilePath, 'base64')
  }
}

export default spec
