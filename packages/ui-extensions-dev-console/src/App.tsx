import {RenderedExtensionrProvider} from './context/RenderedExtensionProvider'
import Playground from './playground'
import {createExtensibilityHost} from './playground/extensibility-host'
import React, {useState} from 'react'
import {I18nContext, I18nManager} from '@shopify/react-i18n'
import {ExtensionPayload, ExtensionServerProvider, isValidSurface} from '@shopify/ui-extensions-server-kit'
import {ExtensibilityHostProvider} from '@shopify/extensibility-host-react'
import {Layout} from '@/foundation/Layout'
import {Routes} from '@/foundation/Routes'
import {Toast} from '@/foundation/Toast'
import {Theme} from '@/foundation/Theme'
import {ModalContainer} from '@/foundation/ModalContainer'

function getConnectionUrl() {
  if (import.meta.env.VITE_CONNECTION_URL) {
    return import.meta.env.VITE_CONNECTION_URL.replace('https', 'wss').replace('/dev-console', '')
  }

  const protocol = location.protocol === 'http:' ? 'ws:' : 'wss:'

  return `${protocol}//${location.host}/extensions`
}

const surface = new URLSearchParams(location.search).get('surface')
const extensionServerOptions = {
  connection: {
    url: getConnectionUrl(),
  },
  surface: isValidSurface(surface) ? surface : undefined,
}

const i18nManager = new I18nManager({
  locale: 'en',
  onError(error) {
    // eslint-disable-next-line no-console
    console.log(error)
  },
})
const host = createExtensibilityHost()

host.ready
  .then(() => {
    host.pluginApi['dev-console'].connect({
      connectOptions: extensionServerOptions,
      devConsole: {
        url: import.meta.env.VITE_CONNECTION_URL,
      },
    })
  })
  // eslint-disable-next-line no-console
  .catch(console.error)

function App() {
  const [showExtension, setShowExtension] = useState<ExtensionPayload | null>(null)

  // host.addExtension({
  //   id: 'reviews-by-product-extension',
  //   name: 'Reviews by Product',
  //   app: {
  //     id: 'reviews-by-product-app',
  //     handle: 'reviews-by-product',
  //     name: 'Reviews by Product',
  //     icon: 'https://unpkg.com/@shopify/polaris-icons@6.5.0/dist/svg/OrdersMinor.svg',
  //   },
  //   extensionPoints: [
  //     {
  //       id: 'reviews-by-product-extension-point-0',
  //       type: 'ui-extension',
  //       target: 'Admin::ProductDetails::Card',
  //       // url: 'reviews-by-product',
  //       url: 'https://deviation-stem-vote-everything.trycloudflare.com/extensions/dev-2784eafd-6277-4c69-ba60-6f7773538392/assets/main.js?lastUpdated=1684437934389',
  //     },
  //   ],
  // })

  return (
    <>
      <ExtensibilityHostProvider host={host}>
        {showExtension && <Playground extension={showExtension} />}
        <RenderedExtensionrProvider extension={showExtension} setRenderedExtension={setShowExtension}>
          <ExtensionServerProvider options={extensionServerOptions}>
            <I18nContext.Provider value={i18nManager}>
              <Theme>
                <Layout>
                  <Routes />
                  <Toast />
                  <ModalContainer />
                </Layout>
              </Theme>
            </I18nContext.Provider>
          </ExtensionServerProvider>
        </RenderedExtensionrProvider>
      </ExtensibilityHostProvider>
    </>
  )
}

export default App
