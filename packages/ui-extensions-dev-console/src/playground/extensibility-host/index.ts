import demoManifestsPlugin from './plugins/demo-manifests'
import appUrlsPlugin from './plugins/app-urls'
import toastsPlugin from './plugins/toasts'
import intentsPlugin from './plugins/intents'
import disambiguationUiPlugin from './plugins/disambiguation-ui'
import sessionTokenPlugin from './plugins/session-token'
import navigationPlugin from './plugins/navigation'
import storagePlugin from './plugins/storage'
import singleActivatePlugin from './plugins/single-activate'
import saveBarPlugin from './plugins/save-bar'
import {UiExtensionRuntime} from './UiExtensionRuntime.js'
import {devConsolePlugin, DevConsoleExtensionPoint} from '@shopify/dev-console-plugin'
import {LinkRuntime, AppBridgeRuntime, PopUpRuntime, createModuleRuntime} from '@shopify/extensibility-host-runtimes'
import {Host} from '@shopify/extensibility-host'

// note: this can technically be a singleton, and we might all be better off for it.
export function createExtensibilityHost() {
  const host = new Host({
    extensionPoints: [
      {...DevConsoleExtensionPoint, plugins: [singleActivatePlugin()]},
      {
        targets: ['Admin::Apps::Home'],
        plugins: [singleActivatePlugin()],
        runtimes: [PopUpRuntime],
      },
      {
        targets: [
          'Admin::Product::SubscriptionPlan::Add',
          'Admin::Product::SubscriptionPlan::Create',
          'Admin::Product::SubscriptionPlan::Remove',
          'Admin::Product::SubscriptionPlan::Edit',
        ],
        plugins: [singleActivatePlugin()],
      },
      {
        targets: [
          'Admin::Order::Action',
          'Admin::Order::Link',
          'Admin::OrderDetails::Link',
          'Admin::OrderDetails::Action',
        ],
        plugins: [singleActivatePlugin()],
      },
      {
        targets: ['Admin::ProductDetails::Card'],
        multiInstance: true,
      },
      {
        targets: ['global'],
      },
    ],
    runtimes: [
      createModuleRuntime(async (module) => {
        const apps = await import('../builtin-apps')
        return apps.default[module]()
      }),
      UiExtensionRuntime,
      AppBridgeRuntime,
      LinkRuntime,
    ],
    plugins: [
      devConsolePlugin(),
      disambiguationUiPlugin(),
      demoManifestsPlugin(),
      appUrlsPlugin(),
      intentsPlugin(),
      toastsPlugin(),
      navigationPlugin(),
      sessionTokenPlugin(),
      storagePlugin(),
      saveBarPlugin(),
    ],
  })

  setTimeout(() => {
    host.telemetry.addListener('*.activated', (data) => {
      console.log('logger:', data.name)
    })

    host.telemetry.start()
    console.log('started telemetry')
  }, 2000)

  return host
}
