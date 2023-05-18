interface Intent {
  action: string
  type: string
  data?: {[key: string]: any}
}

declare global {
  namespace Extensibility {
    interface SearchQuery {
      intent?: Intent
    }
  }
}

function matches(descriptor: Extensibility.ExtensionPoint['manifest'], intent: Intent) {
  const filters = descriptor.intents as Intent[]
  if (filters) {
    for (const {type, action} of filters) {
      if ((!type || type === intent.type) && (!action || action === intent.action)) {
        return true
      }
    }
  }
  return false
}

export default function intentsPlugin(): Extensibility.Plugin {
  return {
    name: 'intents',

    // Resolve `intent:action:type?` and `action:type?` URLs
    async resolveUrl(url) {
      if (url.protocol === 'intent') {
        url = new URL(url.host + url.pathname + url.search + url.hash)
      } else {
        const resolved = await this.resolveUrl(url)
        if (resolved.length) return resolved
      }
      // nothing handled this URL - let's try to resolve it as an intent:
      const intent = {
        action: url.protocol.slice(0, -1),
        type: url.pathname,
        data: Object.fromEntries(url.searchParams.entries()),
      }
      return this.findAll({})
        .filter((extensionPoint) => matches(extensionPoint.manifest, intent))
        .map((extensionPoint) => ({extensionPoint, data: intent}))
    },

    matchExtensionPoint(extensionPoint, search: Extensibility.SearchQuery) {
      if (!search.intent) return false
      return matches(extensionPoint.manifest, search.intent)
    },
  }
}
