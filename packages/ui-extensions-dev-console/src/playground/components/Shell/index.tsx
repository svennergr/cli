import {ShellTopBar} from './ShellTopBar'
import {ShellNav} from './ShellNav'
import {DevMode} from '../DevMode'
import React, {cloneElement} from 'react'
import {Frame, Loading, Modal, Spinner} from '@shopify/polaris'
import {Outlet} from 'react-router'
import {useInstances, useSignal} from '@shopify/extensibility-host-react'

export default function Shell() {
  const navActive = useSignal(false)
  const search = useSignal('')

  function searchChanged(query: string) {
    search.value = query
  }

  return (
    <Frame
      topBar={<ShellTopBar navActive={navActive} search={search} />}
      logo={{
        accessibilityLabel: 'Shopify',
        topBarSource: '/assets/shopify.svg',
      }}
      navigation={<ShellNav search={searchChanged} />}
      showMobileNavigation={navActive.value}
      onNavigationDismiss={() => (navActive.value = false)}
      globalRibbon={<DevMode />}
    >
      <AppNavBar />
      <EmbeddedAppSlot />
      <GlobalSlot />
      <ActionExtensionsSlot />
      <Outlet />
      <LoadingIndicator />
    </Frame>
  )
}

function LoadingIndicator() {
  const instances = useInstances('Admin::Apps::Home', {status: 'loading'})
  return instances.length > 0 ? <Loading /> : null
}

/**
 * Renders "app home" extensions (prev. "embedded apps").
 * Renders both the foreground and cached (running in background) extensions.
 */
function EmbeddedAppSlot() {
  const instances = useInstances('Admin::Apps::Home')

  return (
    <div className="apps">
      {instances.map((instance) => (
        <div
          className="app"
          hidden={instance.status !== 'active'}
          data-appid={instance.extensionPoint.extension.app.id}
          data-pid={instance.id}
          key={instance.id}
        >
          {instance.outlet}
        </div>
      ))}
    </div>
  )
}

/** Exposes a slot called "global" into which plugins can render to access Polaris/React/etc */
function GlobalSlot() {
  const instances = useInstances('global', {status: 'active'})

  return <>{instances.map((inst) => inst.outlet && cloneElement(inst.outlet, {key: inst.id}))}</>
}

/** Exposes a slot for action extensions, which are modals and not bound to a route. */
function ActionExtensionsSlot() {
  const instances = useInstances('*', (instance) => {
    const status = instance.status
    if (status !== 'active' && status !== 'loading' && status !== 'activating' && status !== 'ready') return false
    return instance.extensionPoint.target.endsWith('::Action')
  })

  const instance = instances.find((inst) => inst.status === 'active') || instances[0]

  if (!instance) return null

  return (
    <Modal
      key={instance.id}
      title={instance.extension.name}
      open
      onClose={() => instance.terminate()}
      primaryAction={{
        content: 'Close',
        onAction() {
          instance.terminate()
        },
      }}
    >
      {instance.status !== 'active' && (
        <div className="modalLoadingOverlay">
          <Spinner />
        </div>
      )}
      <div style={{height: '40vh'}}>{instance.outlet}</div>
    </Modal>
  )
}

/** Show a bar above the app home area when the foreground app is from a 3P. */
function AppNavBar() {
  // Returns the extensions targeting this extension point:
  const instances = useInstances('Admin::Apps::Home', {status: 'active'})

  // Get the current active (eg: foreground) extension:
  const foreground = instances[0]?.extensionPoint
  if (!foreground) return null

  // Is the foreground app 1P (vs 3P)?
  const manifest = foreground.extension.app.manifest
  const isBuiltIn = 'modality' in manifest && manifest.modality === 'builtin'

  return (
    <div className="appNavBar" hidden={isBuiltIn}>
      <img src={foreground.extension.app.manifest.icon} alt={`${foreground.extension.app.name} icon`} />
      <h2>{foreground.extension.app.name}</h2>
    </div>
  )
}
