import {renderAiPrompt, renderSuccess, renderTasks} from '@shopify/cli-kit/node/ui'
import {ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate} from 'langchain/prompts'
import {joinPath, dirname} from '@shopify/cli-kit/node/path'
import {sleep} from '@shopify/cli-kit/node/system'
import {z} from 'zod'
import {OpenAIEmbeddings} from 'langchain/embeddings/openai'
import {createStructuredOutputChainFromZod} from 'langchain/chains/openai_functions'
import {ChatOpenAI} from 'langchain/chat_models/openai'
import {fileExistsSync, readFile, writeFile} from '@shopify/cli-kit/node/fs'
import {RecursiveCharacterTextSplitter, TokenTextSplitter} from 'langchain/text_splitter'
import {LLMChain, StuffDocumentsChain} from 'langchain/chains'
import {fetch} from '@shopify/cli-kit/node/http'
import {packageDirectory} from 'pkg-dir'
import clipboard from 'clipboardy'
import {PineconeStore} from 'langchain/vectorstores/pinecone'
import {PineconeClient} from '@pinecone-database/pinecone'
import {fileURLToPath} from 'url'

const zodSchema = z.object({
  command: z.string().describe('The command the developer should run to reach their goal.'),
})

export async function magic({regenerateEmbeddings = false}) {
  const systemMessagePrompt = SystemMessagePromptTemplate.fromTemplate(
    `You are an assistant to a Shopify partner who is building an app with the Shopify CLI.`,
  )
  const humanTemplate = `In the JSON below, delimited by --- MANIFEST ---. you'll find the oclif manifests the Shopify CLI.
  Commands in this json are defined separated by colons, but in the terminal, they are separated by spaces.
  NEVER output commands that include colons.
  --- MANIFEST ---
  {oclif_manifests}
  --- MANIFEST ---

  The following, delimited by --- DOCS ---, is a list of all documentation pages relevant to the user query:
  --- DOCS ---
  {context}
  --- DOCS ---

  Based on the information provided in the context, please answer the following user prompt: {user_prompt}`
  const humanMessagePrompt = HumanMessagePromptTemplate.fromTemplate(humanTemplate)
  const prompt = ChatPromptTemplate.fromPromptMessages([systemMessagePrompt, humanMessagePrompt])

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const rootDir = await packageDirectory({
    cwd: __dirname,
  })
  const fileToRead = joinPath(rootDir!, 'oclif.manifest.json')
  const oclifManifests = await readFile(fileToRead)

  // Create a vector store from the documents.
  let vectorStore: PineconeStore
  const client = new PineconeClient()
  await client.init({
    apiKey: process.env.PINECONE_API_KEY!,
    environment: process.env.PINECONE_ENVIRONMENT!,
  })
  const pineconeIndex = client.Index(process.env.PINECONE_INDEX!)

  if (regenerateEmbeddings) {
    await renderTasks([
      {
        title: 'Creating embeddings',
        task: async () => {
          let aiProcessedTexts

          if (fileExistsSync('ai-processed-docs.txt')) {
            aiProcessedTexts = await readFile('ai-processed-docs.txt')
            aiProcessedTexts = aiProcessedTexts.split('\n\n--- document divider ---\n\n')
          } else {
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
              'https://shopify.dev/docs/api/functions',
              'https://shopify.dev/docs/apps/selling-strategies/discounts/experience',
              'https://shopify.dev/docs/apps/checkout/product-offers/post-purchase',
              'https://shopify.dev/docs/apps/flow/triggers',
              'https://shopify.dev/docs/apps/flow/actions',
              'https://shopify.dev/docs/apps/flow/lifecycle-events',
              'https://shopify.dev/docs/apps/online-store/theme-app-extensions',
              'https://shopify.dev/docs/apps/payments/create-a-payments-app',
            ]

            let texts: string[] = []
            for (const url of docsUrls) {
              // eslint-disable-next-line no-await-in-loop
              const data = await scrapeData(url)
              // eslint-disable-next-line no-await-in-loop
              const cleanedData = await cleanData(data)
              texts = [...texts, ...cleanedData]
            }

            // write texts to disk
            await writeFile('ai-processed-docs.txt', texts.join('\n\n--- document divider ---\n\n'))
            aiProcessedTexts = texts
          }

          const splitter = new RecursiveCharacterTextSplitter()
          const docs = await splitter.createDocuments(aiProcessedTexts)

          vectorStore = await PineconeStore.fromDocuments(docs, new OpenAIEmbeddings(), {
            pineconeIndex,
          })
        },
      },
    ])
  } else {
    vectorStore = await PineconeStore.fromExistingIndex(new OpenAIEmbeddings(), {pineconeIndex})
  }

  // Initialize a retriever wrapper around the vector store
  const vectorStoreRetriever = vectorStore!.asRetriever()

  const llm = new ChatOpenAI({
    temperature: 0,
    modelName: 'gpt-3.5-turbo-16k-0613',
  })

  const llmChain = createStructuredOutputChainFromZod(zodSchema, {
    llm,
    prompt,
  })

  const chain = new StuffDocumentsChain({llmChain})

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

async function scrapeData(url: string) {
  // eslint-disable-next-line no-console
  console.log(`Scraping ${url}`)
  const response = await fetch(url)
  const text = await response.text()
  // keep only the <main> tag from the text
  const mainTag = text.match(/<main.*?>([\s\S]*?)<\/main>/)

  if (mainTag && mainTag[1]) {
    return mainTag[1]
  } else {
    // eslint-disable-next-line no-console
    console.log(`No main tag found for ${url}`)
    return ''
  }
}

async function cleanData(data: string) {
  const humanTemplate = `Below I’m going to give you a section of page contents that were scraped off of a webpage
  about Shopify Apps. The page contents document the tools that developers can use to build Shopify Apps.
  Your job is to clean up the scraped page contents so that it only includes useful knowledge for developers using the
  tools. Preserve necessary html semantics required to understand the documentation while reducing noise.
  Copy any sentences from the scraped page that might be useful into your response. It’s okay to stop in the middle
  of a sentence if that’s where the page contents ends. It’s also ok to return the body as an empty string if there is
  no useful text in the scraped section I gave you. Don’t omit any sentences from the scraped text, only remove things
  that look like text from buttons and footers and junk like that. Be sparing with what you omit. I want to see most
  of the content returned, minus all the one word sentences from buttons and so on.

  This is the last couple of sentences of a section of the page you previously processed. I’m showing you so that
  you can try to make your new section mesh grammatically with the last word of this previously processed text, as we
  will be adding your new “body” response onto the end of it. If it’s empty then nevermind and just start fresh.
  — BEGIN PREVIOUS BODY —
  {existingBody}
  — END PREVIOUS BODY —

  And here are the scraped page contents:
  — BEGIN SCRAPED PAGE CONTENTS —
  {pageContent}
  — END SCRAPED PAGE CONTENTS —

  Only respond with the cleaned up body of the page.`

  const humanMessagePrompt = HumanMessagePromptTemplate.fromTemplate(humanTemplate)
  const systemMessagePrompt = SystemMessagePromptTemplate.fromTemplate(
    'You are a web scraping expert. You are going to determine the most important details in a html document and eliminate the noise.',
  )
  const chatPrompt = ChatPromptTemplate.fromPromptMessages([systemMessagePrompt, humanMessagePrompt])

  const llm = new ChatOpenAI({
    temperature: 0,
    modelName: 'gpt-3.5-turbo-16k',
  })

  const chain = new LLMChain({
    llm,
    prompt: chatPrompt,
  })

  // gpt-3.5-turbo-16k has a token limit of 16384
  const tokenLimit = 16384
  // To provide some context of what was previously processed
  const existingBodyLength = 240
  const chunkSize = (tokenLimit - humanTemplate.length - existingBodyLength) / 2
  const splitter = new TokenTextSplitter({
    chunkSize,
    chunkOverlap: 0,
  })
  const splitDocs = await splitter.createDocuments([data])

  const backOffPeriod = 2
  const cleanedData = []
  let existingBody = ''
  for (let i = 0; i < splitDocs.length; i++) {
    // eslint-disable-next-line no-console
    console.log(`Processing chunk ${i + 1}`)
    const doc = splitDocs[i]
    let result
    try {
      // eslint-disable-next-line no-await-in-loop
      result = await chain.call({
        existingBody,
        pageContent: doc!.pageContent,
      })
      // eslint-disable-next-line no-await-in-loop
      await sleep(backOffPeriod)
      // eslint-disable-next-line no-catch-all/no-catch-all
    } catch (error) {
      // Most likely due to OpenAI's rate limit
      // eslint-disable-next-line no-console
      console.log(`Error: ${error}`)
      // eslint-disable-next-line no-await-in-loop
      await sleep(backOffPeriod)
      continue
    }

    existingBody = doc!.pageContent.slice(-existingBodyLength)
    cleanedData.push(result.text)
  }
  return cleanedData as string[]
}
