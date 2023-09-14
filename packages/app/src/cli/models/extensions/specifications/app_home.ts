import {BaseSchema} from '../schemas.js'
import {AppSchema} from '../../app/app.js'
import {createExtensionSpecification} from '../specification.js'

const AppHomeSchema = BaseSchema.merge(AppSchema.pick({home: true}))

const appHomeSpecification = createExtensionSpecification({
  identifier: 'app_home',
  schema: AppHomeSchema,
  appModuleFeatures: (_) => ['app_config'],
  deployConfig: async (config) => ({
    application_url: config.home?.application_url,
  }),
  getConfigurationObject: (config) => ({
    type: 'app_home',
    name: 'app-home',
    home: config.home,
  }),
})

export default appHomeSpecification
