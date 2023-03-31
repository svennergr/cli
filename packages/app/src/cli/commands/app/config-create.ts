import Command from '../../utilities/app-command.js'
import {appFlags} from '../../flags.js'
import configCreate, {ConfigCreateOptions} from '../../services/app/config-create.js'
import {globalFlags} from '@shopify/cli-kit/node/cli'
import {Args} from '@oclif/core'

export default class ConfigCreate extends Command {
  static description = 'Create a new configuration.'

  static flags = {
    ...globalFlags,
    ...appFlags,
  }

  static args = {
    name: Args.string(),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(ConfigCreate)
    if (!args.name) throw new Error()

    const options: ConfigCreateOptions = {
      commandConfig: this.config,
      directory: flags.path,
      name: args.name,
    }
    await configCreate(options)
  }
}
