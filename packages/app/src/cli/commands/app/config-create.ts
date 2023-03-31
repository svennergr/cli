import Command from '../../utilities/app-command.js'
import {appFlags} from '../../flags.js'
import configCreate, {ConfigCreateOptions} from '../../services/app/config-create.js'
import {globalFlags} from '@shopify/cli-kit/node/cli'

export default class ConfigCreate extends Command {
  static description = 'Create a new configuration.'

  static flags = {
    ...globalFlags,
    ...appFlags,
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(ConfigCreate)
    const options: ConfigCreateOptions = {
      commandConfig: this.config,
      directory: flags.path,
    }
    await configCreate(options)
  }
}
