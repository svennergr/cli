import {createUIExtensionSpecification} from '../ui.js'
import {BaseUIExtensionSchema} from '../schemas.js'
import {joinPath} from '@shopify/cli-kit/node/path'
import {zod} from '@shopify/cli-kit/node/schema'
import fs from 'fs'

export default createUIExtensionSpecification({
  identifier: 'flow_template',
  schema: BaseUIExtensionSchema.extend({
    // Override
    name: zod.string(),
    description: zod.string(),
  }),
  supportedFlavors: [],
  singleEntryPath: false,
  deployConfig: async (config, directory) => {
    return {
      name: config.name,
      description: config.description,
      definition: await loadWorkflow(directory),

      // Unused
      // Hardcoded so we don't have to write them in the toml file
      api_version: 'internal',
      extension_points: [{target: 'Admin::Apps::Home', module: './index.js'}],
      script_path: '../foo',
    }
  },
})

async function loadWorkflow(path: string) {
  const flowFilePath = joinPath(path, '.flow')
  return fs.readFileSync(flowFilePath, 'base64')
}
