import {createUIExtensionSpecification} from '../ui.js'
import {BaseUIExtensionSchema} from '../schemas.js'

import {zod} from '@shopify/cli-kit/node/schema'

export default createUIExtensionSpecification({
  identifier: 'flow_template',
  schema: BaseUIExtensionSchema.extend({
    title: zod.string(),
    description: zod.string(),
    workflow_id: zod.string(),
    workflow_definition_version: zod.string(),
  }),
  supportedFlavors: [],
  singleEntryPath: false,
  deployConfig: async (config, _) => {
    return {
      title: config.title,
      description: config.description,
      workflow_id: config.workflow_id,
      workflow_definition_version: config.workflow_definition_version,
    }
  },
})
