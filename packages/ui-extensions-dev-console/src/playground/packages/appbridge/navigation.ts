import type {createApp} from '@shopify/extensibility-host-runtimes/runtimes/AppBridgeRuntime/client'

type App = ReturnType<typeof createApp>

function isLink(node: Node): node is HTMLAnchorElement {
  return 'protocol' in node
}

export default function navigation(app: App) {
  // Handle clicks on intent/app links by default
  addEventListener('click', (ev) => {
    let target = ev.target as Node | null
    while (target) {
      if (isLink(target)) {
        if (target.protocol === 'intent:' || target.protocol === 'app:') {
          ev.preventDefault()
          app.api.navigation.navigate(target.href)
          return
        }
      }
      target = target.parentNode
    }
  })
}
