import {useLayoutEffect} from 'react'
import {useParams, useLocation} from 'react-router'
import {useExtensibilityHost} from '@shopify/extensibility-host-react'

const APP_HOME_TARGET = 'Admin::Apps::Home'

export default function EmbeddedApp() {
  const host = useExtensibilityHost()
  const location = useLocation()
  const url = location.pathname + location.search
  const params = useParams()
  const handle = params.handle
  const path = handle ? `/${params['*'] || ''}` : url

  useLayoutEffect(() => {
    host.ready.then(() => {
      const search = handle ? {appHandle: handle, target: APP_HOME_TARGET} : {appUrl: url, target: APP_HOME_TARGET}
      const extensionPoint = host.find(search)
      if (!extensionPoint) return console.warn('App not found', search)
      // note: the Host should provide a way to abstract this away
      const customPath = extensionPoint.extension.app.manifest.path
      const data = customPath ? path.replace(customPath, '') : path
      extensionPoint?.launch({data})
      // host.invoke('app://' + extension.app.handle + path);
    })
  }, [handle || url])

  return null
}
