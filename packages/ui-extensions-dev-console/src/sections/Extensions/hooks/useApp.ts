import {useExtensibilityHost} from '@shopify/extensibility-host-react'
import {useExtensionServerContext} from '@shopify/ui-extensions-server-kit'
import {useEffect, useMemo} from 'react'

export function useApp() {
  const host = useExtensibilityHost()
  const extensionServer = useExtensionServerContext()
  const store = extensionServer.state.store
  const app = extensionServer.state.app

  useEffect(() => {
    if (app) {
      console.log(extensionServer.state)
      /* host.addExtension({
        id: '0',
        name: app.title,
        app: {
          id: '1',
          handle: 'home',
          name: app.title,
          icon: 'https://unpkg.com/@shopify/polaris-icons@6.5.0/dist/svg/HomeMinor.svg',
          modality: 'builtin',
          path: '/',
        },
        extensionPoints: extensionServer.state.extensions.map((ext) => ({
          id: ext.uuid,
          type: 'module',
          target: 'Admin::ProductDetails::Card',
          url: 'Reviews-by-Product',
        })),
      })
      host.addExtension({
        id: 'reviews-by-product-extension',
        name: 'Reviews by Product',
        app: {
          id: 'reviews-by-product-app',
          handle: 'reviews-by-product',
          name: 'Reviews by Product',
          icon: 'https://unpkg.com/@shopify/polaris-icons@6.5.0/dist/svg/OrdersMinor.svg',
        },
        extensionPoints: [
          {
            id: 'reviews-by-product-extension-point-0',
            type: 'module',
            target: 'Admin::ProductDetails::Card',
            url: 'Reviews-by-Product',
          },
        ],
      }) */
    }
  }, [JSON.stringify(app), store])

  return useMemo(
    () => ({
      store,
      app,
    }),
    [JSON.stringify(app), store],
  )
}
