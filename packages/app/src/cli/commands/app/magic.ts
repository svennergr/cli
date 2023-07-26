import {appFlags} from '../../flags.js'
import {magic} from '../../services/magic.js'
import Command from '../../utilities/app-command.js'
import {Flags} from '@oclif/core'
import {globalFlags} from '@shopify/cli-kit/node/cli'

export default class AppMagic extends Command {
  static description = 'Help the developer find the right commands to run.'

  static flags = {
    ...globalFlags,
    ...appFlags,
    query: Flags.string({
      hidden: false,
      description: "the developer's question",
      env: 'SHOPIFY_FLAG_QUERY',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(AppMagic)

    return magic({query: flags.query})
  }
}
