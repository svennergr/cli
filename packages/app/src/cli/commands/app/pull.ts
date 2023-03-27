import Command from '../../utilities/app-command.js'
import {appFlags} from '../../flags.js'
import pullConfig, {PullConfigOptions} from '../../services/app/pull.js'
import {globalFlags} from '@shopify/cli-kit/node/cli'

export default class PullConfig extends Command {
  static description = 'Pull your app configuration.'

  static flags = {
    ...globalFlags,
    ...appFlags,
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PullConfig)
    const options: PullConfigOptions = {
      commandConfig: this.config,
      directory: flags.path,
    }
    await pullConfig(options)
  }
}
