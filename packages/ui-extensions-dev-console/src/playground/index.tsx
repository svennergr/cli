import '@shopify/polaris/build/esm/styles.css'
import {createExtensibilityHost} from './extensibility-host'
import './style.css'

import {DevConsoleSlot} from './components/DevConsoleSlot'
import EmbeddedApp from './components/EmbeddedApp'
import Shell from './components/Shell'
import {ToastPlugin} from './components/ToastPlugin'
import {AppProvider, Frame} from '@shopify/polaris'
import {ExtensionPayload} from '@shopify/ui-extensions-server-kit'
import React from 'react'
import {Link, RouterProvider, createBrowserRouter} from 'react-router-dom'

const external = (url: string) => new URL(url, location.href).origin !== location.origin

const Anchor = ({url = '', ...props}) =>
  external(url) ? <a href={url} target="_blank" {...props} /> : <Link to={url} {...props} />

const host = createExtensibilityHost()
if (import.meta.env.DEV) {
  Object.defineProperty(window, 'host', {configurable: true, value: host})
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Shell />,
    children: [
      {
        path: '/channels/:handle/*',
        element: <EmbeddedApp />,
      },
      {
        path: '/apps/:handle/*',
        element: <EmbeddedApp />,
      },
      {
        index: true,
        element: <EmbeddedApp />,
      },
      {
        path: '/:handle/*',
        element: <EmbeddedApp />,
      },
    ],
  },
])

interface Props {
  extension: ExtensionPayload
}

export default function Playground(props: Props) {
  return (
    <AppProvider i18n={{}} linkComponent={Anchor}>
      <Frame>
        <RouterProvider router={router} />
        <DevConsoleSlot />
        <ToastPlugin />
      </Frame>
    </AppProvider>
  )
}
