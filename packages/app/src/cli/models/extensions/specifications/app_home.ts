import {BaseSchema} from '../schemas.js'
import {createExtensionSpecification} from '../specification.js'
import {zod} from '@shopify/cli-kit/node/schema'

const appHomeSpecification = createExtensionSpecification({
  identifier: 'app_home',
  schema: BaseSchema.extend({
    application_url: zod.string(),
  }),
  appModuleFeatures: (_) => [],
  deployConfig: async (config, extensionPath) => {
    return {
      application_url: config.application_url,
    }
  },
})

export default appHomeSpecification
