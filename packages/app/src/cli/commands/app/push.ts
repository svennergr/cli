import Command from '../../utilities/app-command.js'
import {appFlags} from '../../flags.js'
import pushConfig, {PushConfigOptions} from '../../services/app/push.js'
import {globalFlags} from '@shopify/cli-kit/node/cli'

export default class PushConfig extends Command {
  static description = 'Update your app and redirect URLs in the Partners Dashboard.'

  static flags = {
    ...globalFlags,
    ...appFlags,
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PushConfig)
    const options: PushConfigOptions = {
      commandConfig: this.config,
      directory: flags.path,
    }
    await pushConfig(options)
  }
}
