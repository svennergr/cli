import {renderAiPrompt, renderSuccess, renderTasks} from '@shopify/cli-kit/node/ui'
import {ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate} from 'langchain/prompts'
import {joinPath, dirname} from '@shopify/cli-kit/node/path'
import {z} from 'zod'
import {HNSWLib} from 'langchain/vectorstores/hnswlib'
import {OpenAIEmbeddings} from 'langchain/embeddings/openai'
import {createStructuredOutputChainFromZod} from 'langchain/chains/openai_functions'
import {ChatOpenAI} from 'langchain/chat_models/openai'
import {fileExistsSync, readFile} from '@shopify/cli-kit/node/fs'
import {RecursiveCharacterTextSplitter} from 'langchain/text_splitter'
import {StuffDocumentsChain} from 'langchain/chains'
import {fetch} from '@shopify/cli-kit/node/http'
import {packageDirectory} from 'pkg-dir'
import clipboard from 'clipboardy'
import {fileURLToPath} from 'url'

const zodSchema = z.object({
  command: z.string().describe('The command the developer should run to reach their goal.'),
  clarifying_question: z.string().describe('A clarifying question to ask the user.'),
})

export async function magic() {
  const systemMessagePrompt = SystemMessagePromptTemplate.fromTemplate(
    "You are an assistant to a Shopify partner who is building an app with the Shopify CLI. If you don't know the answer, ask a clarifying question, don't try to make up an answer. ",
  )
  const humanTemplate = `In the JSON below, delimited by \`\`\`json. you'll find the oclif manifests the Shopify CLI.
  Commands are in the form of \`app:build\`, which translate to \`shopify app build\` in the terminal.
  \`\`\`json
  {oclif_manifests}
  \`\`\`

  The following, delimited by \`\`\`, is a list of all documentation pages relevant to the user query:
  \`\`\`
  {context}
  \`\`\`

  Based on the information provided in the context, please answer the following user prompt: {user_prompt}`
  const humanMessagePrompt = HumanMessagePromptTemplate.fromTemplate(humanTemplate)
  const prompt = ChatPromptTemplate.fromPromptMessages([systemMessagePrompt, humanMessagePrompt])

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const rootDir = await packageDirectory({
    cwd: __dirname,
  })
  const fileToRead = joinPath(rootDir!, 'ai.json')
  const oclifManifests = await readFile(fileToRead)
  const embeddingsDir = joinPath(rootDir!, 'embeddings')

  // Create a vector store from the documents.
  let vectorStore: HNSWLib

  if (fileExistsSync(embeddingsDir)) {
    vectorStore = await HNSWLib.load(embeddingsDir, new OpenAIEmbeddings())
  } else {
    await renderTasks([
      {
        title: 'Creating embeddings',
        task: async () => {
          const docsUrls = [
            'https://shopify.dev/docs/apps/tools/cli',
            'https://shopify.dev/docs/apps/tools/cli/commands',
            'https://shopify.dev/docs/apps/tools/cli/structure',
            'https://shopify.dev/docs/apps/tools/cli/existing',
            'https://shopify.dev/docs/apps/app-extensions/list',
            'https://shopify.dev/docs/apps/marketing/pixels',
            'https://shopify.dev/docs/apps/admin/admin-actions-and-blocks',
            'https://shopify.dev/docs/apps/app-extensions/getting-started',
            'https://shopify.dev/docs/apps/marketing/marketing-activities',
            'https://shopify.dev/docs/apps/selling-strategies/purchase-options/app-extensions',
            'https://shopify.dev/docs/apps/tools/cli/managing-app-configuration-files',
            'https://shopify.dev/docs/apps/selling-strategies/subscriptions/contracts/create',
            'https://shopify.dev/docs/api/checkout-ui-extensions',
            'https://shopify.dev/docs/api/functions',
            'https://shopify.dev/docs/apps/selling-strategies/discounts/experience',
            'https://shopify.dev/docs/apps/checkout/product-offers/post-purchase',
            'https://shopify.dev/docs/apps/flow/triggers',
            'https://shopify.dev/docs/apps/flow/actions',
            'https://shopify.dev/docs/apps/flow/lifecycle-events',
            'https://shopify.dev/docs/apps/online-store/theme-app-extensions',
            'https://shopify.dev/docs/apps/payments/create-a-payments-app',
            'https://shopify.dev/docs/apps/pos/ui-extensions',
            'https://shopify.dev/docs/apps/pos/links',
            'https://shopify.dev/docs/apps/pos/cart',
            'https://shopify.dev/docs/apps/pos/recommendations',
          ]

          const splitter = RecursiveCharacterTextSplitter.fromLanguage('html', {
            chunkSize: 2000,
            chunkOverlap: 200,
          })

          const texts = []
          for (const url of docsUrls) {
            // eslint-disable-next-line no-await-in-loop
            const response = await fetch(url)
            // eslint-disable-next-line no-await-in-loop
            const text = await response.text()
            // keep only the <main> tag from the text
            const mainTag = text.match(/<main.*?>([\s\S]*?)<\/main>/)
            if (mainTag && mainTag[1]) {
              texts.push(mainTag[1])
            } else {
              // eslint-disable-next-line no-console
              console.log(`No main tag found for ${url}`)
            }
          }

          const docs = await splitter.createDocuments(texts)
          vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings())
          await vectorStore.save(embeddingsDir)
        },
      },
    ])
  }

  // Initialize a retriever wrapper around the vector store
  const vectorStoreRetriever = vectorStore!.asRetriever()

  const llm = new ChatOpenAI({
    temperature: 0,
    modelName: 'gpt-3.5-turbo-0613',
  })

  const llmChain = createStructuredOutputChainFromZod(zodSchema, {
    llm,
    prompt,
  })

  const chain = new StuffDocumentsChain({llmChain, verbose: true})

  const command = await renderAiPrompt({
    chain,
    chainParams: {
      oclif_manifests: oclifManifests,
    },
    retriever: vectorStoreRetriever,
  })

  clipboard.writeSync(command)

  renderSuccess({
    headline: ["I've copied the command to the clipboard: ", {command}, {char: '.'}],
  })
}
