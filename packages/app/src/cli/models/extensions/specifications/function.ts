import {createExtensionSpecification} from '../specification.js'
import {BaseFunctionConfigurationSchema} from '../schemas.js'
import {defaultFunctionsFlavors} from '../../../constants.js'

const spec = createExtensionSpecification({
  identifier: 'function',
  additionalIdentifiers: [
    'order_discounts',
    'cart_checkout_validation',
    'cart_transform',
    'delivery_customization',
    'payment_customization',
    'product_discounts',
    'shipping_discounts',
    'fulfillment_constraints',
  ],
  surface: 'admin',
  singleEntryPath: false,
  schema: BaseFunctionConfigurationSchema,
  supportedFlavors: defaultFunctionsFlavors,
  partnersWebIdentifier: 'function',
  graphQLType: 'function',
  isPreviewable: false,
  appModuleFeatures: (_) => ['function'],
})

export default spec