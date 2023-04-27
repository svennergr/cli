import Command from '../../utilities/app-command.js'
import {appFlags} from '../../flags.js'
import {clearAllInfo, getCurrentToml, setCurrentToml} from '../../services/local-storage.js'
import {tomlFilePath} from '../../models/app/loader.js'
import connect from '../../services/app/connect.js'
import {globalFlags} from '@shopify/cli-kit/node/cli'
import {Args, Config, Flags} from '@oclif/core'
import {renderSelectPrompt, renderSuccess} from '@shopify/cli-kit/node/ui'
import {relativePath} from '@shopify/cli-kit/node/path'
import {promises} from 'fs'

export default class Use extends Command {
  static description = 'Choose which toml file to use.'

  static flags = {
    ...globalFlags,
    ...appFlags,
    clear: Flags.boolean(),
  }

  static args = {
    toml: Args.string(),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Use)
    const options: UseOptions = {
      commandConfig: this.config,
      directory: flags.path,
      toml: args.toml,
      clear: flags.clear,
    }
    await use(options)
  }
}

interface UseOptions {
  commandConfig: Config
  directory: string
  toml?: string
  clear?: boolean
}

export async function use(options: UseOptions): Promise<void> {
  if (options.clear) {
    clearAllInfo(options.directory)
    renderSuccess({
      headline: 'Cleared cached organization and last configuration used.',
    })
    return
  }

  let toml = options.toml
  if (!toml && toml !== '') {
    const files = (await promises.readdir(options.directory)).filter(
      (file) => file.startsWith('shopify.app.') && file.endsWith('.toml'),
    )
    if (files.length === 0) {
      await connect({directory: options.directory, commandConfig: options.commandConfig})
      await use({...options, toml: getCurrentToml(options.directory).toml})
      return
    }

    toml = await renderSelectPrompt({
      message: 'Choose a toml file',
      choices: files.map((file) => {
        return {label: file, value: file.match(/shopify\.app\.?(.*)\.toml/)![1]}
      }),
    })
  }

  setCurrentToml({
    directory: options.directory,
    toml,
  })

  const file = tomlFilePath(options.directory, toml)

  renderSuccess({
    headline: `Using file ${relativePath(options.directory, file)}`,
  })
}
