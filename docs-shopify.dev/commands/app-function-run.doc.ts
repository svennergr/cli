// This is an autogenerated file. Don't edit this file manually.
import {ReferenceEntityTemplateSchema} from '@shopify/generate-docs'

const data: ReferenceEntityTemplateSchema = {
  name: 'app function run',
  description: `Runs the function from your current directory for [testing purposes](/docs/apps/functions/testing-and-debugging). To learn how you can monitor and debug functions when errors occur, refer to [Shopify Functions error handling](/docs/api/functions/errors).`,
  overviewPreviewDescription: `Run a function locally for testing.`,
  type: 'command',
  isVisualComponent: false,
  defaultExample: {
    codeblock: {
      tabs: [
        {
          title: 'app function run',
          code: './examples/app-function-run.example.sh',
          language: 'bash',
        },
      ],
      title: 'app function run',
    },
  },
  definitions: [
  {
    title: 'Flags',
    description: 'The following flags are available for the `app function run` command:',
    type: 'appfunctionrun',
  },
  ],
  category: 'app',
  related: [
  ],
}

export default data