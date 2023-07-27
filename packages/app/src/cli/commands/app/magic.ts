import {magic} from '../../services/magic.js'
import Command from '../../utilities/app-command.js'
import {Flags} from '@oclif/core'

export default class AppMagic extends Command {
  static description = 'Help the developer find the right commands to run.'

  static flags = {
    'regenerate-embeddings': Flags.boolean({
      hidden: false,
      description: 'Regenereate the embeddings',
      env: 'SHOPIFY_FLAG_REGENERATE_EMBEDDINGS',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(AppMagic)

    return magic({regenerateEmbeddings: flags['regenerate-embeddings']})
  }
}
