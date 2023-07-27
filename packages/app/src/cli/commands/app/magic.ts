import {magic} from '../../services/magic.js'
import Command from '../../utilities/app-command.js'

export default class AppMagic extends Command {
  static description = 'Help the developer find the right commands to run.'

  public async run(): Promise<void> {
    return magic()
  }
}
