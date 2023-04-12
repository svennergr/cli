import {appFlags} from '../../flags.js'
import {AppInterface} from '../../models/app/app.js'
import {load as loadApp} from '../../models/app/loader.js'
import Command from '../../utilities/app-command.js'
import {loadExtensionsSpecifications} from '../../models/extensions/specifications.js'
import {createApp} from '../../services/dev/select-app.js'
import {fetchOrgFromId} from '../../services/dev/fetch.js'
import {getAppInfo, setAppInfo} from '../../services/local-storage.js'
import {Flags} from '@oclif/core'
import {globalFlags} from '@shopify/cli-kit/node/cli'
import {ensureAuthenticatedPartners} from '@shopify/cli-kit/node/session'
import {touchFileSync, writeFileSync} from '@shopify/cli-kit/node/fs'
import {encodeToml} from '@shopify/cli-kit/node/toml'

export default class Create extends Command {
  static description = 'Create a new app.'

  static flags = {
    ...globalFlags,
    ...appFlags,
    json: Flags.boolean({
      hidden: false,
      description: 'format output as JSON',
      env: 'SHOPIFY_FLAG_JSON',
    }),
    'web-env': Flags.boolean({
      hidden: false,
      description: 'Outputs environment variables necessary for running and deploying web/.',
      env: 'SHOPIFY_FLAG_OUTPUT_WEB_ENV',
      default: false,
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Create)
    const specifications = await loadExtensionsSpecifications(this.config)
    const app: AppInterface = await loadApp({specifications, directory: flags.path, mode: 'report'})
    const appInfo = getAppInfo(flags.path)

    const token = await ensureAuthenticatedPartners()
    const org = await fetchOrgFromId(appInfo?.orgId!, token)

    const newApp = await createApp(org, 'My app', token)

    setAppInfo({
      appId: newApp.apiKey,
      directory: appInfo?.directory!,
      appEnv: newApp.title,
      orgId: appInfo?.orgId,
    })

    const newTomlPath = flags.path.concat(`/shopify.app.${newApp.title}.toml`)

    // console.log({newTomlPath})
    touchFileSync(newTomlPath)

    writeFileSync(newTomlPath, encodeToml(app.configuration))

    if (app.errors) process.exit(2)
  }
}
