import Command from '../../utilities/app-command.js'
import {appFlags} from '../../flags.js'
import connect, {ConnectOptions} from '../../services/app/connect.js'
import {globalFlags} from '@shopify/cli-kit/node/cli'

export default class Connect extends Command {
  static description = 'Connect your shopify app configuration to this codebase.'

  static flags = {
    ...globalFlags,
    ...appFlags,
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Connect)
    const options: ConnectOptions = {
      commandConfig: this.config,
      directory: flags.path,
    }
    await connect(options)
  }
}
