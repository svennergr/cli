import Command from '../../utilities/app-command.js'
import {appFlags} from '../../flags.js'
import pushConfig, {PushConfigOptions} from '../../services/app/push-config.js'
import {globalFlags} from '@shopify/cli-kit/node/cli'
import {Flags} from '@oclif/core'

export default class PushConfig extends Command {
  static description = 'Update your app and redirect URLs in the Partners Dashboard.'

  static flags = {
    ...globalFlags,
    ...appFlags,
    'api-key': Flags.string({
      hidden: false,
      description: 'The API key of your app.',
      env: 'SHOPIFY_FLAG_APP_API_KEY',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(PushConfig)
    const options: PushConfigOptions = {
      apiKey: flags['api-key'],
      commandConfig: this.config,
      directory: flags.path,
    }
    await pushConfig(options)
  }
}
