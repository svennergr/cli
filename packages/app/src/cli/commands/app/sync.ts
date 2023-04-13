import Command from '../../utilities/app-command.js'
import {appFlags} from '../../flags.js'
import pullConfig, {PullConfigOptions} from '../../services/app/pull.js'
import {globalFlags} from '@shopify/cli-kit/node/cli'
import {Args} from '@oclif/core'

export default class SyncConfig extends Command {
  static description = 'Pull your app configuration.'

  static flags = {
    ...globalFlags,
    ...appFlags,
  }

  static args = {
    'app-env': Args.string(),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(SyncConfig)
    const options: PullConfigOptions = {
      commandConfig: this.config,
      directory: flags.path,
      appEnv: args['app-env'] ?? '',
    }
    await pullConfig(options)
  }
}
