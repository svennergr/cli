import {createElement} from 'react'
import {createWorkerFactory} from '@shopify/web-worker'
import {createController, createRemoteReceiver, RemoteRenderer} from '@remote-ui/react/host'
import {Runtime} from '@shopify/extensibility-host'
import type {ReactElement} from 'react'

const createWorker = createWorkerFactory<any>(
  `https://cdn.shopify.com/shopifycloud/web/assets/v1/admin-ui-extensions-host/ext-host-sandbox-endpoint.js`,
)

export class UiExtensionRuntime extends Runtime {
  static type = 'ui-extension'
  components?: any
  worker = createWorker()

  private renderable?: ReactElement

  async initialize({context}: Extensibility.LaunchOptions): Promise<void> {
    if (context?.api) {
      const {api} = this.instance
      api.expose(context.api)
    }

    this.components = await this.componentLoader(context)

    if (this.components == null || typeof this.components !== 'object' || Array.isArray(this.components)) {
      this.components = await this.defaultComponentLoader(context)
    }
    await this.worker.sandbox(this.instance.api.getGlobal())
  }

  async run() {
    await this.start()
  }

  async reload(): Promise<void> {
    await this.start()
  }

  async start() {
    const controller = createController(this.components)
    const receiver = createRemoteReceiver()

    this.renderable = createElement(RemoteRenderer, {
      controller,
      receiver,
    })

    const {api, extensionPoint} = this.instance
    const target = extensionPoint.target as any

    api.expose({extensionPoint: target})

    await this.worker.load(extensionPoint.manifest.url)

    await this.worker.render(
      target,
      {channel: receiver.receive, components: Object.keys(this.components)},
      api.get() as any,
      extensionPoint.extension.manifest.localization,
    )
  }

  defaultComponentLoader: (context: Extensibility.LaunchOptions['context']) => Promise<any> = () =>
    import(/* webpackChunkName: 'UiExtensionRuntimeAllComponents' */ '@shopify/app-kit-internal-react')

  setComponentLoader(loader: (context: Extensibility.LaunchOptions['context']) => Promise<any>) {
    this.componentLoader = loader
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  private componentLoader: (context: Extensibility.LaunchOptions['context']) => Promise<any> =
    this.defaultComponentLoader

  get outlet() {
    return this.renderable ?? null
  }
}

export function isUiExtensionRuntime(
  runtime: Extensibility.Runtime | UiExtensionRuntime,
): runtime is UiExtensionRuntime {
  return (runtime as UiExtensionRuntime).setComponentLoader !== undefined
}
