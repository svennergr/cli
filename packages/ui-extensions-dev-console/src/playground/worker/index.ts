import {connectSubscribables, createSubscription} from './subscription'
import {createHistory, createLocation} from './navigation'
import {createEndpoint, retain} from '@remote-ui/rpc'
import {createRemoteRoot} from '@remote-ui/react'
import {createApiProxy, setupApiAsync} from '@shopify/extensibility-host-runtimes/runtimes/AppBridgeRuntime/api-proxy'
import type {RemoteChannel} from '@remote-ui/core'

const registeredExtensions = new Map()

const endpoint = createEndpoint(self as any)

// Define api proxies that needs to be accessed outside of the render call
const defaultProxy: any = {
  // Navigation needs to be defined here because it needs
  // to be accessible by the global `history` and `location` object
  navigation: createApiProxy(),
}

// Create subscriptions to host values that can be mutated
const subscriptions: any = {
  location: createSubscription({pathname: '', hash: '', search: ''}, () => {
    // Dispatch a custom popstate event when the location changes
    self.dispatchEvent(new Event('popstate'))
  }),
}

const history = createHistory(defaultProxy.navigation.navigate)
// History doesn't exist in a web worker so we have to assign it directly
;(self as any).history = history

// Using Reflect.defineProperty doesn't seem to work here
Object.defineProperty(self, 'location', createLocation(history, subscriptions.location))

const api: any = {
  extend(extensionPoint: string, callback: () => Promise<void>) {
    registeredExtensions.set(extensionPoint, callback)
  },
}

Reflect.defineProperty(self, 'shopify', {
  value: api,
  configurable: false,
  enumerable: true,
  writable: false,
})

Reflect.defineProperty(self, 'host', {
  value: api,
  configurable: false,
  enumerable: true,
  writable: false,
})

Reflect.defineProperty(self, 'extend', {
  value: api.extend.bind(api),
  configurable: false,
  enumerable: true,
  writable: false,
})

endpoint.expose({
  load(script: string) {
    // This call makes sure all existing registered extensionPoint is removed
    // when loading new script in same WebWorker environment.
    // This could happen via liveReloadingEnabled or refresh in the DevTool
    registeredExtensions.clear()
    importScripts(new URL(script, origin).href)
  },
  async render(extensionPoint: string, {proxy, subscribables}: any, components: string[], channel: RemoteChannel) {
    const api = await setupApiAsync(proxy.keys, proxy.resolveApi)
    api.extensionPoint = extensionPoint

    connectSubscribables(subscriptions, subscribables)

    if (!registeredExtensions.has(extensionPoint)) {
      return false
    }

    retain(channel)
    // retain(api);

    const callback = registeredExtensions.get(extensionPoint)!

    const remoteRoot = createRemoteRoot(channel, {
      components,
    })
    callback(remoteRoot, api)
    remoteRoot.mount()

    return true
  },
})
