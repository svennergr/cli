import {renderInfo, renderTasks, renderTextPrompt} from '@shopify/cli-kit/node/ui'
import {ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate} from 'langchain/prompts'
import {resolvePath, joinPath, dirname} from '@shopify/cli-kit/node/path'
import {readFile} from '@shopify/cli-kit/node/fs'
import {ChatOpenAI} from 'langchain/chat_models/openai'
import {z} from 'zod'
import {createStructuredOutputChainFromZod} from 'langchain/chains/openai_functions'
import {fileURLToPath} from 'url'

const zodSchema = z.object({
  command: z.string().describe('The command the developer should run to reach their goal.'),
})

export async function magic({query}: {query?: string}) {
  let userPrompt = query

  if (!userPrompt) {
    // eslint-disable-next-line require-atomic-updates
    userPrompt = await renderTextPrompt({
      message: 'What would you like to do?',
    })
  }

  const template = 'You are an assistant to a Shopify partner who is building an app with the Shopify CLI.'
  const systemMessagePrompt = SystemMessagePromptTemplate.fromTemplate(template)
  const humanTemplate = `In the JSON below, you'll find two keys: "commands" and "docs". The "commands" key contains the oclif manifests the Shopify CLI, while the "docs" key contains the documentation of the Shopify CLI.
  \`\`\`json
  {context}
  \`\`\`

  Based on the information provided in the context, please answer the following user prompt: {userPrompt}`
  const humanMessagePrompt = HumanMessagePromptTemplate.fromTemplate(humanTemplate)
  const prompt = ChatPromptTemplate.fromPromptMessages([systemMessagePrompt, humanMessagePrompt])

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const rootDir = resolvePath(__dirname, '../../../../..')
  const fileToRead = joinPath(rootDir, 'ai.json')
  const aiContext = await readFile(fileToRead)

  const llm = new ChatOpenAI({
    temperature: 0,
    modelName: 'gpt-3.5-turbo-16k-0613',
  })

  const chain = createStructuredOutputChainFromZod(zodSchema, {
    llm,
    prompt,
  })

  let response

  await renderTasks([
    {
      title: 'Thinking',
      task: async () => {
        response = await chain.call({
          context: aiContext,
          userPrompt,
        })
      },
    },
  ])

  renderInfo({
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    headline: ['Run', {command: response!.output.command}, {char: '.'}],
  })
}
