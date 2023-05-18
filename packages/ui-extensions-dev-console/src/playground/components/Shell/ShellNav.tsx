import {AppIcon} from '../AppIcon'
import React, {useMemo, useRef} from 'react'
import {Navigation, NavigationItemProps, Spinner} from '@shopify/polaris'
import {ChevronRightMinor, ToolsMajor} from '@shopify/polaris-icons'
import {useLocation, useNavigate, useNavigationType, NavigationType} from 'react-router'
import {useExtensibilityHost, useExtensionPoints, useComputed, useSignalEffect} from '@shopify/extensibility-host-react'
import {DevConsoleSearchQuery} from '@shopify/dev-console-plugin'

export function ShellNav({search}: {search(search: string): void}) {
  const location = useLocation().pathname
  const navigate = useNavigate()
  const navigationType = useNavigationType()

  const [devConsole] = useExtensionPoints(DevConsoleSearchQuery)

  // RR doesn't "unset" the navigation type after it is applied.
  const lastNavType = useRef<NavigationType>()
  useMemo(() => (lastNavType.current = navigationType), [location])

  const extensibility = useExtensibilityHost()

  // const appHomeExtensions1 = useExtensionPoint('Admin::Apps::Home');
  // @todo - this could use useSlotExtensions('EmbeddedApp'), but the return value is not a Signal.
  const appHomeExtensions = useComputed(() => extensibility.findAll({target: 'Admin::Apps::Home'}))

  const nextForeground = useComputed(() =>
    appHomeExtensions.value.find((extensionPoint) => extensionPoint.activeInstance),
  )

  useSignalEffect(() => {
    // ignore link navs:
    const wasPop = lastNavType.current === NavigationType.Pop
    // mark this render's navigation as used:
    lastNavType.current = undefined
    // foreground app:
    // console.log({nextForeground: nextForeground.value});
    const app = nextForeground.value?.extension.app
    // ignore popstate and non-app URLs:
    if (wasPop || !app) return
    // generate URLs:
    const modality = 'modality' in app.manifest ? app.manifest.modality : ''
    const prefix = modality === 'channel' ? 'channels' : 'apps'
    // console.log(app.handle, modality, prefix);

    let url = app.manifest.path || `/${prefix}/${app.handle}`
    const data = nextForeground.value?.activeInstance?.api?.get().data
    if (data) url += `${data}`.replace(/^\/*/, '/')
    // ignore repeat views
    if (url !== location) navigate(url)
  })

  const navItems = useComputed(() =>
    appHomeExtensions.value.map((extensionPoint) => {
      const app = extensionPoint.extension.app
      const modality = 'modality' in app.manifest ? app.manifest.modality : ''
      const prefix = modality === 'channel' ? 'channels' : 'apps'
      const url = app.manifest.path || `/${prefix}/${app.handle}`
      const inst = extensionPoint.activeInstance || extensionPoint.instances[0]
      const foreground = inst?.status === 'active'

      return {
        app,
        selected: foreground,
        // onClick: () => apps.launch(app.handle),
        badge: inst && inst.status === 'loading' ? <Spinner size="small" /> : undefined,
        url,
        // exactMatch: app.custom?.path === '/',
        // hack to show remote app icons inline
        icon: () =>
          app.manifest.icon.startsWith('/apps/') ? (
            <></>
          ) : (
            <AppIcon icon={app.manifest.icon} filter="grayscale(1)" rounded />
          ),
      }
    }),
  )

  const groups = useComputed(() =>
    navItems.value.reduce(
      (groups, {app, selected, url, badge, icon}) => {
        if (app.manifest.hideFromNav) return groups
        const group = ('modality' in app.manifest && app.manifest.modality) || 'app'
        groups[group].push({
          label: app.name,
          selected,
          url,
          badge,
          icon,
        })
        return groups
      },
      {
        builtin: [] as NavigationItemProps[],
        channel: [] as NavigationItemProps[],
        app: [] as NavigationItemProps[],
      },
    ),
  )

  return (
    <Navigation location="">
      <Navigation.Section items={groups.value.builtin} />
      <Navigation.Section
        title="Sales Channels"
        action={{
          icon: ChevronRightMinor,
          accessibilityLabel: 'View all sales channels',
          onClick: () => search('Sales Channels'),
        }}
        items={groups.value.channel}
      />
      <Navigation.Section
        title="Apps"
        action={{
          icon: ChevronRightMinor,
          accessibilityLabel: 'View all apps',
          onClick: () => search('Apps'),
        }}
        items={groups.value.app}
      />
      {devConsole != null && (
        <div style={{height: '100%'}}>
          <Navigation.Section
            items={[
              {
                label: devConsole.activeInstance ? 'Close DevConsole' : 'DevConsole',
                icon: ToolsMajor,
                onClick() {
                  if (devConsole.activeInstance) devConsole.activeInstance.terminate()
                  else devConsole.launch()
                },
              },
            ]}
          />
        </div>
      )}
    </Navigation>
  )
}
