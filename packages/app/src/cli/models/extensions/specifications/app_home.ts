import {BaseSchemaWithHandle} from '../schemas.js'
import {createExtensionSpecification} from '../specification.js'
import {zod} from '@shopify/cli-kit/node/schema'

const AppHomeExtensionSchema = BaseSchemaWithHandle.extend({
  type: zod.literal('app_home'),
  schema: zod.string().optional(),
  application_url: zod.string(),
})

/**
 * Extension specification with all properties and methods needed to load a Flow Trigger.
 */
const appHomeSpecification = createExtensionSpecification({
  identifier: 'app_home',
  schema: AppHomeExtensionSchema,
  // AppHome doesn't have anything to bundle but we need to set this to true to
  // ensure that the extension configuration is uploaded after registration in
  // https://github.com/Shopify/cli/blob/73ac91c0f40be0a57d1b18cb34254b12d3a071af/packages/app/src/cli/services/deploy.ts#L107
  // Should be removed after unified deployment is 100% rolled out
  appModuleFeatures: (_) => ['bundling'],
  deployConfig: async (config, extensionPath) => {
    return {
      title: config.name,
      handle: config.handle,
      description: config.description,
      application_url: config.application_url,
    }
  },
})

export default appHomeSpecification
