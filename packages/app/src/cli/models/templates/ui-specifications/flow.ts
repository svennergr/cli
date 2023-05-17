import {ExtensionTemplate} from '../../app/template.js'

/**
 * Flow extension template specification.
 */
const flowActionUIExtension: ExtensionTemplate = {
  identifier: 'flow_action_definition_2',
  name: 'Flow Action',
  group: 'Flow',
  supportLinks: [],
  types: [
    {
      url: 'https://github.com/Shopify/cli',
      type: 'flow_action_definition_2',
      extensionPoints: [],
      supportedFlavors: [
        {
          name: 'Config only',
          value: 'config-only',
          path: 'packages/app/templates/ui-extensions/projects/flow_action',
        },
      ],
    },
  ],
}

export default flowActionUIExtension
