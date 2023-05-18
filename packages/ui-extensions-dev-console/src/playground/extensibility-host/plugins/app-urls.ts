const APP_HOME_EXTENSION_POINT = 'Admin::Apps::Home'

export default function appUrlsPlugin(): Extensibility.Plugin {
  return {
    name: 'app-urls',
    async resolveUrl(url) {
      if (url.protocol !== 'app:') return
      const [, handle, path] = url.pathname.match(/([^/]+)\/?(.*?)$/) || []
      const data = path + url.search + url.hash

      // Find any app-home extension (argo or web) with the handle:
      // @todo - this isn't waiting for authoritative find() results!
      const exts = this.findAll({
        appHandle: handle,
        target: APP_HOME_EXTENSION_POINT,
      })

      if (!exts.length) return

      // Forward the link's data (for Embedded Apps, up in the URL):
      return exts.map((extensionPoint) => ({extensionPoint, data}))
    },
  }
}
