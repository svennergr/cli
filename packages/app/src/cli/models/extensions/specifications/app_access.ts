import {createExtensionSpecification} from '../specification.js'
import {AppSchema} from '../../app/app.js'
import {BaseSchema} from '../schemas.js'

const AppAccessSchema = BaseSchema.merge(AppSchema.pick({access: true}))

const spec = createExtensionSpecification({
  identifier: 'app_access',
  schema: AppAccessSchema,
  appModuleFeatures: (_) => ['app_config'],
  deployConfig: async (config) => ({
    direct_api_offline_access: config.access?.direct_api_offline_access,
  }),
  getConfigurationObject: (config) => ({
    type: 'app_access',
    name: 'app-access',
    access: config.access,
  }),
})

export default spec
