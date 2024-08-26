// eslint-disable-next-line spaced-comment, @typescript-eslint/triple-slash-reference
/// <reference lib="dom" />

export type HotReloadEvent =
  | {
      type: 'open'
      pid: string
    }
  | {
      type: 'section'
      key: string
      names: string[]
    }
  | {
      type: 'css'
      key: string
    }
  | {
      type: 'ext-css'
      key: string
    }
  | {
      type: 'full'
      key: string
    }

export function getClientScripts() {
  return injectFunction(hotReloadScript)
}

function injectFunction(fn: () => void) {
  return `<script>(${fn.toString()})()</script>`
}

/**
 * The following are functions serialized and injected into the client's HTML.
 * Therefore, do not use any imports or references to external variables here.
 */
function hotReloadScript() {
  let serverPid: string | undefined

  const prefix = '[HotReload]'
  const evtSource = new EventSource('/__hot-reload/subscribe', {withCredentials: true})

  // eslint-disable-next-line no-console
  const logInfo = console.info.bind(console, prefix)

  // eslint-disable-next-line no-console
  const logError = console.error.bind(console, prefix)

  const fullPageReload = (key: string, error?: Error) => {
    if (error) logError(error)
    logInfo('Full reload:', key)
    window.location.reload()
  }

  const reloadIfErrorPage = () => {
    if (document.body.id === 'full-error-page') {
      fullPageReload('Error page update')
    }
  }

  const refreshHTMLLinkElements = (elements: HTMLLinkElement[]) => {
    for (const element of elements) {
      // The `href` property prepends the host to the pathname. Use attributes instead:
      element.setAttribute('href', element.getAttribute('href')!.replace(/v=\d+$/, `v=${Date.now()}`))
    }
  }

  const handleOpen = (data: HotReloadEvent & {type: 'open'}) => {
    serverPid ??= data.pid

    // If the server PID is different it means that the process has been restarted.
    // Trigger a full-refresh to get all the latest changes.
    if (serverPid !== data.pid) {
      fullPageReload('Reconnected to new server')
    }
  }

  const handleSection = async (data: HotReloadEvent & {type: 'section'}) => {
    const elements = data.names.flatMap((name) =>
      Array.from(document.querySelectorAll(`[id^='shopify-section'][id$='${name}']`)),
    )

    if (elements.length > 0) {
      const controller = new AbortController()

      await Promise.all(
        elements.map(async (element) => {
          const sectionId = element.id.replace(/^shopify-section-/, '')
          const response = await fetch(
            `/__hot-reload/render?section-id=${encodeURIComponent(
              sectionId,
            )}&section-template-name=${encodeURIComponent(data.key)}&pathname=${encodeURIComponent(
              window.location.pathname,
            )}&search=${encodeURIComponent(window.location.search)}`,
            {signal: controller.signal},
          )

          if (!response.ok) {
            throw new Error(`Hot reload request failed: ${response.statusText}`)
          }

          const updatedSection = await response.text()

          // SFR will send a header to indicate it used the replace-templates
          // to render the section. If it didn't, we need to do a full reload.
          if (response.headers.get('x-templates-from-params') === '1') {
            // eslint-disable-next-line require-atomic-updates
            element.outerHTML = updatedSection
          } else {
            controller.abort('Full reload required')
            fullPageReload(data.key, new Error('Hot reload not supported for this section.'))
          }
        }),
      ).catch((error: Error) => {
        controller.abort('Request error')
        fullPageReload(data.key, error)
      })

      logInfo(`Updated sections for "${data.key}":`, data.names)
    } else {
      // No sections found. This might be an error page or contain syntax errors.
      reloadIfErrorPage()

      // If we're still here, this might be due to a syntax error in the section file.
      // In this case, the rendered page does not include the section ID in the DOM,
      // only a syntax error message as a text node. Check the outerText of the document,
      // which is the shortest string that contains text nodes:
      const documentText = document.documentElement.outerText
      if (documentText.includes('Liquid syntax error')) {
        fullPageReload(data.key, new Error('Syntax error in document'))
      }
    }
  }

  const handleCSS = (data: HotReloadEvent & {type: 'css'}) => {
    const elements: HTMLLinkElement[] = Array.from(
      document.querySelectorAll(`link[rel="stylesheet"][href^="/cdn/"][href*="${data.key}?"]`),
    )

    refreshHTMLLinkElements(elements)
    logInfo(`Updated theme CSS: ${data.key}`)
  }

  const handleExtCSS = (data: HotReloadEvent & {type: 'ext-css'}) => {
    const elements: HTMLLinkElement[] = Array.from(
      document.querySelectorAll(`link[rel="stylesheet"][href^="/main/cdn/"][href*="${data.key}?"]`),
    )

    refreshHTMLLinkElements(elements)
    logInfo(`Updated extension CSS: ${data.key}`)
  }

  const handleFull = (data: HotReloadEvent & {type: 'full'}) => {
    fullPageReload(data.key)
  }

  evtSource.onopen = () => logInfo('Connected')
  evtSource.onerror = (event) => {
    if (event.eventPhase === EventSource.CLOSED) {
      logError('Connection closed by the server, attempting to reconnect...')
    } else {
      logError('Error occurred, attempting to reconnect...')
    }
  }

  evtSource.onmessage = async (event) => {
    if (!event.data || typeof event.data !== 'string') return

    const data = JSON.parse(event.data)
    logInfo('Event data:', data)

    switch (data.type) {
      case 'open':
        handleOpen(data)
        break
      case 'section':
        await handleSection(data)
        break
      case 'css':
        handleCSS(data)
        break
      case 'ext-css':
        handleExtCSS(data)
        break
      case 'full':
        handleFull(data)
        break
      default:
        logError('Unhandled event type:', data.type)
    }
  }
}
