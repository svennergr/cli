import {appFlags} from '../../flags.js'
import {AppInterface} from '../../models/app/app.js'
import {load as loadApp} from '../../models/app/loader.js'
import Command from '../../utilities/app-command.js'
import {loadExtensionsSpecifications} from '../../models/extensions/specifications.js'
import {createApp} from '../../services/dev/select-app.js'
import {fetchOrgFromId} from '../../services/dev/fetch.js'
import {getAppInfo, setAppInfo} from '../../services/local-storage.js'
import {appEnvPrompt} from '../../prompts/dev.js'
import {pushAndWriteConfig} from '../../services/app/push.js'
import {Flags} from '@oclif/core'
import {globalFlags} from '@shopify/cli-kit/node/cli'
import {ensureAuthenticatedPartners} from '@shopify/cli-kit/node/session'
import {copyFile} from '@shopify/cli-kit/node/fs'
import {renderSuccess} from '@shopify/cli-kit/node/ui'
import {relativePath} from '@shopify/cli-kit/node/path'
import {partnersFqdn} from '@shopify/cli-kit/node/context/fqdn'

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
    const token = await ensureAuthenticatedPartners()
    const specifications = await loadExtensionsSpecifications(this.config)
    const defaultApp: AppInterface = await loadApp({specifications, directory: flags.path, mode: 'report'})
    const appInfo = getAppInfo(flags.path)

    const org = await fetchOrgFromId(appInfo?.orgId!, token)

    const envName = await appEnvPrompt(defaultApp.name, 'dev')

    await copyFile(flags.path.concat('/shopify.app.toml'), flags.path.concat(`/shopify.app.${envName}.toml`))

    const newApp = await createApp(org, `${defaultApp.name} - ${envName}`, token, true)

    const localNewApp = await loadApp({specifications, directory: flags.path, appConfigName: envName})

    localNewApp.configuration.urls!.applicationUrl = 'https://example.com'

    await pushAndWriteConfig(localNewApp, newApp.apiKey, token)

    setAppInfo({
      appId: newApp.apiKey,
      directory: appInfo?.directory!,
      appEnv: envName,
      orgId: appInfo?.orgId,
    })

    // const newTomlPath = flags.path.concat(`/shopify.app.${envName}.toml`)

    // console.log({newTomlPath})
    // writeFileSync(newTomlPath, encodeToml(defau.configuration))

    // if (defaultApp.errors) process.exit(2)

    const fqdn = await partnersFqdn()
    renderSuccess({
      headline: 'New app configuration created',
      customSections: [
        {
          title: 'Configuration file',
          body: relativePath(localNewApp.directory, localNewApp.configurationPath),
        },
        {
          title: 'Partners dashboard',
          body: `https://${fqdn}/${org.id}/apps/${newApp.id}/overview`,
        },
      ],
    })
  }
}
