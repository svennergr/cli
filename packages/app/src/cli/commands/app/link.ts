import Command from '../../utilities/app-command.js'
import {appFlags} from '../../flags.js'
import link, {LinkOptions} from '../../services/app/link.js'
import {globalFlags} from '@shopify/cli-kit/node/cli'

export default class Link extends Command {
  static description = 'Connect your shopify app configuration to this codebase.'

  static flags = {
    ...globalFlags,
    ...appFlags,
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Link)
    const options: LinkOptions = {
      commandConfig: this.config,
      directory: flags.path,
    }
    await link(options)
  }
}
