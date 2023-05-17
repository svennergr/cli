import Command from '../../../utilities/app-command.js'
import {appFlags} from '../../../flags.js'
import pushConfig, {PushConfigOptions} from '../../../services/app/config/push.js'
import {getCurrentToml} from '../../../services/local-storage.js'
import {globalFlags} from '@shopify/cli-kit/node/cli'
import {Flags} from '@oclif/core'

export default class UpdateConfig extends Command {
  static description = 'Update your app and redirect URLs in the Partners Dashboard.'

  static flags = {
    ...globalFlags,
    ...appFlags,
    config: Flags.string({
      hidden: true,
      description: 'The configuration context under which this ',
      env: 'SHOPIFY_FLAG_APP_ENVIRONMENT',
    }),
  }

  static args = {}

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(UpdateConfig)
    const config = flags.config ? flags.config : getCurrentToml(flags.path).toml

    const options: PushConfigOptions = {
      commandConfig: this.config,
      directory: flags.path,
      appEnv: config ?? '',
    }
    await pushConfig(options)
  }
}
