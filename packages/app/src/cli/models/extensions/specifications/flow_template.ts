// import {createUIExtensionSpecification} from '../ui.js'
import {BaseSchema} from '../schemas.js'
import {createExtensionSpecification} from '../specification.js'
import {joinPath} from '@shopify/cli-kit/node/path'
import {zod} from '@shopify/cli-kit/node/schema'
import fs from 'fs'

const FlowTemplateExtensionSchema = BaseSchema.extend({
  name: zod.string(),
  type: zod.literal('flow_template'),
  template: zod.object({
    title: zod.string(),
    description: zod.string(),
    categories: zod.array(zod.string()),
    pre_install_note: zod.string().optional(),
    post_install_note: zod.string().optional(),
  }),
})

const spec = createExtensionSpecification({
  identifier: 'flow_template',
  schema: FlowTemplateExtensionSchema,
  singleEntryPath: false,
  appModuleFeatures: (_) => [],
  deployConfig: async (config, directory) => {
    return {
      title: config.template.title,
      description: config.template.description,
      categories: config.template.categories,
      pre_install_note: config.template.pre_install_note,
      post_install_note: config.template.post_install_note,
      definition: await loadWorkflow(directory),
    }
  },
})

async function loadWorkflow(path: string) {
  const flowFilePath = joinPath(path, '.flow')
  return fs.readFileSync(flowFilePath, 'base64')
}

export default spec
