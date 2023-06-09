import {ExtensionTemplate} from '../../app/template.js'

/**
 * Flow Template extension template specification.
 */
const flowTemplateExtension: ExtensionTemplate = {
  identifier: 'flow_template',
  name: 'Flow Template',
  group: 'Flow',
  supportLinks: [],
  types: [
    {
      url: 'https://github.com/Shopify/cli',
      type: 'flow_template',
      extensionPoints: [],
      supportedFlavors: [
        {
          name: 'Config only',
          value: 'config-only',
          path: 'templates/generic-extensions/projects/flow_template',
        },
      ],
    },
  ],
}

export default flowTemplateExtension
