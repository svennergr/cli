import {AppInterface} from '../models/app/app.js'

export function isAppConfigType(app: AppInterface, type: string) {
  const extensionInstances = app.extensionsForType({
    identifier: type,
    externalIdentifier: type,
  })
  return extensionInstances[0]?.specification.appModuleFeatures().includes('app_config')
}
