import {renderInfo, renderTasks, renderTextPrompt} from '@shopify/cli-kit/node/ui'
import {ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate} from 'langchain/prompts'
import {resolvePath, joinPath, dirname} from '@shopify/cli-kit/node/path'
import {z} from 'zod'
import {HNSWLib} from 'langchain/vectorstores/hnswlib'
import {OpenAIEmbeddings} from 'langchain/embeddings/openai'
import {createStructuredOutputChainFromZod} from 'langchain/chains/openai_functions'
import {ChatOpenAI} from 'langchain/chat_models/openai'
import {fileExistsSync, readFile} from '@shopify/cli-kit/node/fs'
import {RecursiveCharacterTextSplitter} from 'langchain/text_splitter'
import {StuffDocumentsChain} from 'langchain/chains'
import {fetch} from '@shopify/cli-kit/node/http'
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

  const systemMessagePrompt = SystemMessagePromptTemplate.fromTemplate(
    'You are an assistant to a Shopify partner who is building an app with the Shopify CLI.',
  )
  const humanTemplate = `In the JSON below, delimited by \`\`\`json. you'll find the oclif manifests the Shopify CLI.
  Commands are in the form of \`app:build\`, which translate to \`shopify app build\` in the terminal.
  \`\`\`json
  {oclifManifests}
  \`\`\`

  The following, delimited by \`\`\` is a list of all documentation pages relevant to the user query:
  \`\`\`
  {context}
  \`\`\`

  Based on the information provided in the context, please answer the following user prompt: {userPrompt}`
  const humanMessagePrompt = HumanMessagePromptTemplate.fromTemplate(humanTemplate)
  const prompt = ChatPromptTemplate.fromPromptMessages([systemMessagePrompt, humanMessagePrompt])

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const rootDir = resolvePath(__dirname, '../../../../..')
  const fileToRead = joinPath(rootDir, 'ai.json')
  const oclifManifests = await readFile(fileToRead)
  const embeddingsDir = joinPath(rootDir, 'embeddings')

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
            texts.push(mainTag![1]!)
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
  const relevantDocs = await vectorStoreRetriever.getRelevantDocuments(userPrompt)

  // eslint-disable-next-line no-console
  console.log(relevantDocs)

  const llm = new ChatOpenAI({
    temperature: 0,
    modelName: 'gpt-3.5-turbo-16k-0613',
  })

  const llmChain = createStructuredOutputChainFromZod(zodSchema, {
    llm,
    prompt,
  })

  const chain = new StuffDocumentsChain({llmChain})

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let response: {[key: string]: any}

  await renderTasks([
    {
      title: 'Thinking',
      task: async () => {
        response = await chain.call({
          input_documents: relevantDocs,
          userPrompt,
          oclifManifests,
          verbose: true,
        })
      },
    },
  ])

  renderInfo({
    headline: ['Run', {command: response!.output.command}, {char: '.'}],
  })
}
