import Command from '../../utilities/app-command.js'
import {appFlags} from '../../flags.js'
import pushConfig, {PushConfigOptions} from '../../services/app/push.js'
import {globalFlags} from '@shopify/cli-kit/node/cli'
import {Args} from '@oclif/core'

export default class UpdateConfig extends Command {
  static description = 'Update your app and redirect URLs in the Partners Dashboard.'

  static flags = {
    ...globalFlags,
    ...appFlags,
  }

  static args = {
    'app-env': Args.string(),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(UpdateConfig)
    const options: PushConfigOptions = {
      commandConfig: this.config,
      directory: flags.path,
      appEnv: args['app-env'] ?? '',
    }
    await pushConfig(options)
  }
}
