import {ensureDevContext} from './context.js'
import {
  generateFrontendURL,
  generatePartnersURLs,
  getURLs,
  shouldOrPromptUpdateURLs,
  startTunnelPlugin,
  updateURLs,
} from './dev/urls.js'
import {installAppDependencies} from './dependencies.js'
import {devUIExtensions} from './dev/extension.js'
import {outputUpdateURLsResult, renderDev} from './dev/output.js'
import {themeExtensionArgs} from './dev/theme-extension-args.js'
import {fetchSpecifications} from './generate/fetch-extension-specifications.js'
import {sendUninstallWebhookToAppServer} from './webhook/send-app-uninstalled-webhook.js'
import {setupConfigWatcher, setupDraftableExtensionBundler, setupFunctionWatcher} from './dev/extension/bundler.js'
import {setCachedAppInfo} from './local-storage.js'
import {renderDevPreviewWarning} from './extensions/common.js'
import {bundleAndBuildExtensionsInConcurrent} from './deploy/bundle.js'
import {
  ReverseHTTPProxyTarget,
  runConcurrentHTTPProcessesAndPathForwardTraffic,
} from '../utilities/app/http-reverse-proxy.js'
import {
  getAppScopesArray,
  AppInterface,
  Web,
  WebType,
  isLegacyAppSchema,
  isCurrentAppSchema,
} from '../models/app/app.js'
import metadata from '../metadata.js'
import {fetchProductVariant} from '../utilities/extensions/fetch-product-variant.js'
import {loadApp} from '../models/app/loader.js'
import {getAppIdentifiers} from '../models/app/identifiers.js'
import {getAnalyticsTunnelType} from '../utilities/analytics.js'
import {buildAppURLForWeb} from '../utilities/app/app-url.js'
import {HostThemeManager} from '../utilities/host-theme-manager.js'

import {ExtensionInstance} from '../models/extensions/extension-instance.js'
import {DevSessionGenerateUrlMutation, DevSessionGenerateUrlSchema} from '../api/graphql/dev_session_generate_url.js'
import {DevSessionUpdateMutation} from '../api/graphql/dev_session_update.js'
import {DevSessionCreateMutation, DevSessionCreateSchema} from '../api/graphql/dev_session_create.js'
import {Config} from '@oclif/core'
import {reportAnalyticsEvent} from '@shopify/cli-kit/node/analytics'
import {execCLI2} from '@shopify/cli-kit/node/ruby'
import {checkPortAvailability, getAvailableTCPPort} from '@shopify/cli-kit/node/tcp'
import {AbortSignal} from '@shopify/cli-kit/node/abort'
import {hashString} from '@shopify/cli-kit/node/crypto'
import {exec} from '@shopify/cli-kit/node/system'
import {isSpinEnvironment, spinFqdn} from '@shopify/cli-kit/node/context/spin'
import {
  AdminSession,
  ensureAuthenticatedAdmin,
  ensureAuthenticatedPartners,
  ensureAuthenticatedStorefront,
} from '@shopify/cli-kit/node/session'
import {OutputProcess, outputInfo, outputSuccess} from '@shopify/cli-kit/node/output'
import {AbortError} from '@shopify/cli-kit/node/error'
import {getBackendPort} from '@shopify/cli-kit/node/environment'
import {renderWarning} from '@shopify/cli-kit/node/ui'
import {basename, dirname, joinPath} from '@shopify/cli-kit/node/path'
import {TunnelClient} from '@shopify/cli-kit/node/plugins/tunnel'
import {adminRequest} from '@shopify/cli-kit/node/api/admin'
import {inTemporaryDirectory, mkdir} from '@shopify/cli-kit/node/fs'
import {fetch, formData} from '@shopify/cli-kit/node/http'
import {Writable} from 'stream'
import {readFileSync} from 'fs'

const MANIFEST_VERSION = '3'

export interface DevOptions {
  directory: string
  id?: number
  configName?: string
  apiKey?: string
  storeFqdn?: string
  reset: boolean
  update: boolean
  commandConfig: Config
  skipDependenciesInstallation: boolean
  subscriptionProductUrl?: string
  checkoutCartUrl?: string
  tunnelUrl?: string
  noTunnel: boolean
  theme?: string
  themeExtensionPort?: number
  notify?: string
}

export interface UpdateAppModulesOptions {
  app: AppInterface
  extensions: ExtensionInstance[]
  adminSession: AdminSession
  token: string
  apiKey: string
  stdout?: Writable
}

export async function updateAppModules({
  app,
  extensions,
  adminSession,
  token,
  apiKey,
  stdout,
}: UpdateAppModulesOptions) {
  await inTemporaryDirectory(async (tmpDir) => {
    try {
      const signedUrlResult: DevSessionGenerateUrlSchema = await adminRequest(
        DevSessionGenerateUrlMutation,
        adminSession,
        {
          apiKey,
        },
      )

      const bundlePath = joinPath(tmpDir, `bundle.zip`)
      await mkdir(dirname(bundlePath))
      const identifiers = {app: apiKey, extensionIds: {}, extensions: {}}
      await bundleAndBuildExtensionsInConcurrent({
        app,
        identifiers,
        extensions,
        bundlePath,
        stdout:
          stdout ??
          new Writable({
            write(chunk, ...args) {
              // Do nothing if there is stdout
            },
          }),
      })

      const form = formData()
      const buffer = readFileSync(bundlePath)
      form.append('my_upload', buffer)
      await fetch(signedUrlResult.generateDevSessionSignedUrl.signedUrl, {
        method: 'put',
        body: buffer,
        headers: form.getHeaders(),
      })

      const appModules = await Promise.all(
        extensions.flatMap((ext) => ext.bundleConfig({identifiers, token, apiKey, unifiedDeployment: true})),
      )

      await adminRequest(DevSessionUpdateMutation, adminSession, {
        apiKey,
        appModules,
        bundleUrl: signedUrlResult.generateDevSessionSignedUrl.signedUrl,
      })

      const names = extensions.map((ext) => ext.localIdentifier).join(', ')

      if (stdout) {
        outputInfo(`Updated app modules: ${names}`, stdout)
      } else {
        outputSuccess(`Ephemeral dev session is ready`)
      }
      // eslint-disable-next-line no-catch-all/no-catch-all
    } catch (error) {
      outputInfo(`Failed to update app modules: ${error}`, stdout)
    }
  })
}

async function dev(options: DevOptions) {
  // Be optimistic about tunnel creation and do it as early as possible
  const tunnelPort = await getAvailableTCPPort()

  let tunnelClient: TunnelClient | undefined
  if (!options.tunnelUrl && !options.noTunnel) {
    tunnelClient = await startTunnelPlugin(options.commandConfig, tunnelPort, 'cloudflare')
  }

  const token = await ensureAuthenticatedPartners()
  const {
    storeFqdn,
    remoteApp,
    remoteAppUpdated,
    updateURLs: cachedUpdateURLs,
    configName,
  } = await ensureDevContext(options, token)

  const apiKey = remoteApp.apiKey
  const specifications = await fetchSpecifications({token, apiKey, config: options.commandConfig})
  let localApp = await loadApp({directory: options.directory, specifications, configName})

  if (!options.skipDependenciesInstallation && !localApp.usesWorkspaces) {
    localApp = await installAppDependencies(localApp)
  }

  if (
    isCurrentAppSchema(localApp.configuration) &&
    !localApp.configuration.access_scopes?.use_legacy_install_flow &&
    getAppScopesArray(localApp.configuration).sort().join(',') !== remoteApp.requestedAccessScopes?.sort().join(',')
  ) {
    const nextSteps = [['Run', {command: 'shopify app config push'}, 'to push your scopes to the Partner Dashboard']]

    renderWarning({
      headline: [`The scopes in your TOML don't match the scopes in your Partner Dashboard`],
      body: [
        `Scopes in ${basename(localApp.configurationPath)}:`,
        scopesMessage(getAppScopesArray(localApp.configuration)),
        '\n',
        'Scopes in Partner Dashboard:',
        scopesMessage(remoteApp.requestedAccessScopes || []),
      ],
      nextSteps,
    })
  }

  const frontendConfig = localApp.webs.find((web) => isWebType(web, WebType.Frontend))
  const backendConfig = localApp.webs.find((web) => isWebType(web, WebType.Backend))
  const webhooksPath =
    localApp.webs.map(({configuration}) => configuration.webhooks_path).find((path) => path) || '/api/webhooks'
  const sendUninstallWebhook = Boolean(webhooksPath) && remoteAppUpdated && Boolean(frontendConfig || backendConfig)

  await validateCustomPorts(localApp.webs)

  const [{frontendUrl, frontendPort, usingLocalhost}, backendPort, currentURLs] = await Promise.all([
    generateFrontendURL({
      ...options,
      app: localApp,
      tunnelClient,
    }),
    getBackendPort() || backendConfig?.configuration.port || getAvailableTCPPort(),
    getURLs(apiKey, token),
  ])
  let frontendServerPort = frontendConfig?.configuration.port
  if (frontendConfig) {
    if (!frontendServerPort) {
      frontendServerPort = frontendConfig === backendConfig ? backendPort : await getAvailableTCPPort()
    }
    frontendConfig.configuration.port = frontendServerPort
  }

  const exposedUrl = usingLocalhost ? `${frontendUrl}:${frontendPort}` : frontendUrl
  const proxyTargets: ReverseHTTPProxyTarget[] = []
  const proxyPort = usingLocalhost ? await getAvailableTCPPort() : frontendPort
  const proxyUrl = usingLocalhost ? `${frontendUrl}:${proxyPort}` : frontendUrl
  const hmrServerPort = frontendConfig?.configuration.hmr_server ? await getAvailableTCPPort() : undefined

  // By default, preview goes to the direct URL for the app.
  let previewUrl = buildAppURLForWeb(storeFqdn, apiKey)
  let shouldUpdateURLs = false

  // ///////////////////////////
  // ///////////////////////////

  const adminSession = await ensureAuthenticatedAdmin(storeFqdn)

  const ephemeralApp: DevSessionCreateSchema = await adminRequest(DevSessionCreateMutation, adminSession, {
    title: 'my-app',
    scopes: ['write_products'],
    application: exposedUrl,
  })

  if (!ephemeralApp.devSessionCreate.app) {
    throw new AbortError(`Failed to create ephemeral app, you might have reached the limit of custom apps in your shop`)
  }

  // outputInfo(`Ephemeral app created: ${ephemeralApp.devSessionCreate.app.id}`)

  await updateAppModules({
    app: localApp,
    extensions: localApp.allExtensions,
    adminSession,
    token,
    apiKey: ephemeralApp.devSessionCreate.app.apiKey,
  })
  // ///////////////////////////
  // ///////////////////////////

  if (frontendConfig || backendConfig) {
    if (options.update) {
      const newURLs = generatePartnersURLs(
        exposedUrl,
        localApp.webs.map(({configuration}) => configuration.auth_callback_path).find((path) => path),
      )
      shouldUpdateURLs = await shouldOrPromptUpdateURLs({
        currentURLs,
        appDirectory: localApp.directory,
        cachedUpdateURLs,
        newApp: remoteApp.newApp,
        localApp,
        apiKey,
      })
      if (shouldUpdateURLs) await updateURLs(newURLs, apiKey, token, localApp)
      await outputUpdateURLsResult(shouldUpdateURLs, newURLs, remoteApp, localApp)
    }
  }

  // If we have a real UUID for an extension, use that instead of a random one
  const prodEnvIdentifiers = getAppIdentifiers({app: localApp})
  const envExtensionsIds = prodEnvIdentifiers.extensions || {}
  const extensionsIds = prodEnvIdentifiers.app === apiKey ? envExtensionsIds : {}
  localApp.allExtensions.forEach((ext) => (ext.devUUID = extensionsIds[ext.localIdentifier] ?? ext.devUUID))

  const additionalProcesses: OutputProcess[] = []

  const apiSecret = (remoteApp.apiSecret as string) ?? ''

  const webOptions = {
    apiKey,
    scopes: isLegacyAppSchema(localApp.configuration)
      ? localApp.configuration.scopes
      : localApp.configuration.access_scopes?.scopes,
    apiSecret,
    backendPort,
    frontendServerPort,
    hmrServerPort,
  }

  await Promise.all(
    localApp.webs.map(async (web) => {
      const isFrontend = isWebType(web, WebType.Frontend)
      const hostname = isFrontend ? frontendUrl : exposedUrl
      const fullWebOptions: DevWebOptions = {...webOptions, web, hostname}

      if (isFrontend && !usingLocalhost) {
        proxyTargets.push(await devProxyTarget(fullWebOptions))
      } else {
        let port: number
        if (isFrontend) {
          port = frontendPort
        } else if (isWebType(web, WebType.Backend)) {
          port = backendPort
        } else {
          port = await getAvailableTCPPort()
        }
        additionalProcesses.push(await devNonProxyTarget(fullWebOptions, port))
      }
    }),
  )

  const unifiedDeployment = remoteApp?.betas?.unifiedAppDeployment ?? false
  const deploymentMode = unifiedDeployment ? 'unified' : 'legacy'

  await metadata.addPublicMetadata(() => ({
    cmd_app_deployment_mode: deploymentMode,
  }))

  const previewableExtensions = localApp.allExtensions.filter((ext) => ext.isPreviewable)
  const draftableExtensions = localApp.allExtensions.filter((ext) => ext.isDraftable(unifiedDeployment))

  if (previewableExtensions.length > 0) {
    // If any previewable extensions, the preview URL should be the dev console approach
    previewUrl = `${proxyUrl}/extensions/dev-console`
    const devExt = await devUIExtensionsTarget({
      app: localApp,
      id: remoteApp.id,
      apiKey,
      url: proxyUrl,
      storeFqdn,
      grantedScopes: remoteApp.grantedScopes,
      subscriptionProductUrl: options.subscriptionProductUrl,
      checkoutCartUrl: options.checkoutCartUrl,
      extensions: previewableExtensions,
    })
    proxyTargets.push(devExt)
  }

  if (draftableExtensions.length > 0) {
    additionalProcesses.push(
      devDraftableExtensionTarget({
        app: localApp,
        apiKey: ephemeralApp.devSessionCreate.app.apiKey,
        url: proxyUrl,
        token,
        adminSession,
        extensions: draftableExtensions,
        remoteExtensions: {},
        unifiedDeployment,
      }),
    )
  }

  const themeExtensions = localApp.allExtensions.filter((ext) => ext.isThemeExtension)
  if (themeExtensions.length > 0) {
    const adminSession = await ensureAuthenticatedAdmin(storeFqdn)
    const extension = themeExtensions[0]!
    let optionsToOverwrite = {}
    if (!options.theme) {
      const theme = await new HostThemeManager(adminSession).findOrCreate()
      optionsToOverwrite = {
        theme: theme.id.toString(),
        generateTmpTheme: true,
      }
    }
    const [storefrontToken, args] = await Promise.all([
      ensureAuthenticatedStorefront(),
      themeExtensionArgs(extension, apiKey, token, {...options, ...optionsToOverwrite}),
    ])
    const devExt = devThemeExtensionTarget(args, adminSession, storefrontToken, token, unifiedDeployment)
    additionalProcesses.push(devExt)
  }

  await renderDevPreviewWarning(remoteApp, localApp)

  if (sendUninstallWebhook) {
    additionalProcesses.push({
      prefix: 'webhooks',
      action: async (stdout: Writable, stderr: Writable, signal: AbortSignal) => {
        // If we have a backend, use that port, otherwise use the frontend port
        const deliveryPort = backendConfig ? backendPort : frontendPort

        await sendUninstallWebhookToAppServer({
          stdout,
          token,
          address: `http://localhost:${deliveryPort}${webhooksPath}`,
          sharedSecret: apiSecret,
          storeFqdn,
        })
      },
    })
  }

  setPreviousAppId(options.directory, apiKey)

  await logMetadataForDev({devOptions: options, tunnelUrl: frontendUrl, shouldUpdateURLs, storeFqdn})

  await reportAnalyticsEvent({config: options.commandConfig})

  if (proxyTargets.length === 0) {
    await renderDev(
      {
        processes: additionalProcesses,
        keepRunningAfterProcessesResolve: true,
      },
      previewUrl,
      adminSession,
      ephemeralApp.devSessionCreate.app.id,
    )
  } else {
    await runConcurrentHTTPProcessesAndPathForwardTraffic({
      previewUrl,
      portNumber: proxyPort,
      proxyTargets,
      additionalProcesses,
      ephemeralAppId: ephemeralApp.devSessionCreate.app.id,
      adminSession,
    })
  }
}

function setPreviousAppId(directory: string, apiKey: string) {
  setCachedAppInfo({directory, previousAppId: apiKey})
}

function isWebType(web: Web, type: WebType): boolean {
  return web.configuration.roles.includes(type)
}

interface DevWebOptions {
  web: Web
  backendPort: number
  frontendServerPort: number | undefined
  hmrServerPort?: number
  apiKey: string
  apiSecret?: string
  hostname?: string
  scopes?: string
}

async function devNonProxyTarget(options: DevWebOptions, port: number): Promise<OutputProcess> {
  const {logPrefix, action} = await devProxyTarget(options)
  return {
    prefix: logPrefix,
    action: async (stdout: Writable, stderr: Writable, signal: AbortSignal) => {
      await action(stdout, stderr, signal, port)
    },
  }
}

function devThemeExtensionTarget(
  args: string[],
  adminSession: AdminSession,
  storefrontToken: string,
  token: string,
  unifiedDeployment = false,
): OutputProcess {
  return {
    prefix: 'extensions',
    action: async (stdout: Writable, stderr: Writable, signal: AbortSignal) => {
      await execCLI2(['extension', 'serve', ...args], {
        store: adminSession.storeFqdn,
        adminToken: adminSession.token,
        storefrontToken,
        token,
        stdout,
        stderr,
        signal,
        unifiedDeployment,
      })
    },
  }
}

async function devProxyTarget(options: DevWebOptions): Promise<ReverseHTTPProxyTarget> {
  const port = options.web.configuration.port

  const {commands} = options.web.configuration
  const [cmd, ...args] = commands.dev.split(' ')

  const env = {
    SHOPIFY_API_KEY: options.apiKey,
    SHOPIFY_API_SECRET: options.apiSecret,
    HOST: options.hostname,
    SCOPES: options.scopes,
    NODE_ENV: `development`,
    ...(isSpinEnvironment() && {
      SHOP_CUSTOM_DOMAIN: `shopify.${await spinFqdn()}`,
    }),
    BACKEND_PORT: `${options.backendPort}`,
    FRONTEND_PORT: `${options.frontendServerPort}`,
    ...(options.hmrServerPort && {
      HMR_SERVER_PORT: `${options.hmrServerPort}`,
    }),
    APP_URL: options.hostname,
    APP_ENV: 'development',
    // Note: These are Remix-specific variables
    REMIX_DEV_ORIGIN: options.hostname,
  }

  const hmrServerOptions = options.hmrServerPort &&
    options.web.configuration.roles.includes(WebType.Frontend) && {
      port: options.hmrServerPort,
      httpPaths: options.web.configuration.hmr_server!.http_paths,
    }

  return {
    logPrefix: options.web.configuration.name ?? ['web', ...options.web.configuration.roles].join('-'),
    customPort: port,
    ...(hmrServerOptions && {hmrServer: hmrServerOptions}),
    action: async (stdout: Writable, stderr: Writable, signal: AbortSignal, port: number) => {
      await exec(cmd!, args, {
        cwd: options.web.directory,
        stdout,
        stderr,
        signal,
        env: {
          ...env,
          PORT: `${port}`,
          // Note: These are Laravel variables for backwards compatibility with 2.0 templates.
          SERVER_PORT: `${port}`,
        },
      })
    },
  }
}

interface DevUIExtensionsTargetOptions {
  app: AppInterface
  apiKey: string
  url: string
  storeFqdn: string
  grantedScopes: string[]
  id?: string
  subscriptionProductUrl?: string
  checkoutCartUrl?: string
  extensions: ExtensionInstance[]
}

async function devUIExtensionsTarget({
  app,
  apiKey,
  id,
  url,
  storeFqdn,
  grantedScopes,
  subscriptionProductUrl,
  checkoutCartUrl,
  extensions,
}: DevUIExtensionsTargetOptions): Promise<ReverseHTTPProxyTarget> {
  const cartUrl = await buildCartURLIfNeeded(extensions, storeFqdn, checkoutCartUrl)
  return {
    logPrefix: 'extensions',
    pathPrefix: '/extensions',
    action: async (stdout: Writable, stderr: Writable, signal: AbortSignal, port: number) => {
      await devUIExtensions({
        app,
        id,
        extensions,
        stdout,
        stderr,
        signal,
        url,
        port,
        storeFqdn,
        apiKey,
        grantedScopes,
        checkoutCartUrl: cartUrl,
        subscriptionProductUrl,
        manifestVersion: MANIFEST_VERSION,
      })
    },
  }
}

interface DevDraftableExtensionsOptions {
  app: AppInterface
  apiKey: string
  url: string
  token: string
  adminSession: AdminSession
  extensions: ExtensionInstance[]
  remoteExtensions: {
    [key: string]: string
  }
  unifiedDeployment: boolean
}

export function devDraftableExtensionTarget({
  extensions,
  app,
  url,
  apiKey,
  token,
  adminSession,
  remoteExtensions,
  unifiedDeployment,
}: DevDraftableExtensionsOptions) {
  return {
    prefix: 'extensions',
    action: async (stdout: Writable, stderr: Writable, signal: AbortSignal) => {
      // Functions will only be passed to this target if unified deployments are enabled
      // ESBuild will take care of triggering an initial build & upload for the extensions with ESBUILD feature.
      // For the rest we need to manually upload an initial draft.

      // const initialDraftExtensions = extensions.filter((ext) => !ext.isESBuildExtension)
      // await Promise.all(
      //   initialDraftExtensions.map(async (extension) => {
      //     await extension.build({app, stdout, stderr, useTasks: false, signal})
      //     const registrationId = remoteExtensions[extension.localIdentifier]
      //     if (!registrationId) throw new AbortError(`Extension ${extension.localIdentifier} not found on remote app.`)
      //     await updateExtensionDraft({extension, token, apiKey, registrationId, stdout, stderr, unifiedDeployment})
      //   }),
      // )
      outputInfo(`Watching for changes to draftable extensions...`, stdout)
      await Promise.all(
        extensions
          .map((extension) => {
            // const registrationId = remoteExtensions[extension.localIdentifier]
            // if (!registrationId) throw new AbortError(`Extension ${extension.localIdentifier} not found on remote app.`)

            const actions = [
              setupConfigWatcher({
                app,
                extension,
                token,
                adminSession,
                apiKey,
                registrationId: '',
                stdout,
                stderr,
                signal,
                unifiedDeployment,
              }),
            ]

            // Only extensions with esbuild feature should be whatched using esbuild
            if (extension.features.includes('esbuild')) {
              actions.push(
                setupDraftableExtensionBundler({
                  extension,
                  app,
                  url,
                  token,
                  adminSession,
                  apiKey,
                  registrationId: '',
                  stderr,
                  stdout,
                  signal,
                  unifiedDeployment,
                }),
              )
            }

            // watch for Function changes that require a build and push
            if (extension.isFunctionExtension) {
              // watch for changes
              actions.push(
                setupFunctionWatcher({
                  extension,
                  app,
                  stdout,
                  stderr,
                  signal,
                  token,
                  apiKey,
                  registrationId: '',
                  unifiedDeployment,
                }),
              )
            }

            return actions
          })
          .flat(),
      )
    },
  }
}

/**
 * To prepare Checkout UI Extensions for dev'ing we need to retrieve a valid product variant ID
 * @param extensions - The UI Extensions to dev
 * @param store - The store FQDN
 */
async function buildCartURLIfNeeded(extensions: ExtensionInstance[], store: string, checkoutCartUrl?: string) {
  const hasUIExtension = extensions.map((ext) => ext.type).includes('checkout_ui_extension')
  if (!hasUIExtension) return undefined
  if (checkoutCartUrl) return checkoutCartUrl
  const variantId = await fetchProductVariant(store)
  return `/cart/${variantId}:1`
}

async function logMetadataForDev(options: {
  devOptions: DevOptions
  tunnelUrl: string
  shouldUpdateURLs: boolean
  storeFqdn: string
}) {
  const tunnelType = await getAnalyticsTunnelType(options.devOptions.commandConfig, options.tunnelUrl)
  await metadata.addPublicMetadata(() => ({
    cmd_dev_tunnel_type: tunnelType,
    cmd_dev_tunnel_custom_hash: tunnelType === 'custom' ? hashString(options.tunnelUrl) : undefined,
    cmd_dev_urls_updated: options.shouldUpdateURLs,
    store_fqdn_hash: hashString(options.storeFqdn),
    cmd_app_dependency_installation_skipped: options.devOptions.skipDependenciesInstallation,
    cmd_app_reset_used: options.devOptions.reset,
  }))

  await metadata.addSensitiveMetadata(() => ({
    store_fqdn: options.storeFqdn,
    cmd_dev_tunnel_custom: tunnelType === 'custom' ? options.tunnelUrl : undefined,
  }))
}

async function validateCustomPorts(webConfigs: Web[]) {
  const allPorts = webConfigs.map((config) => config.configuration.port).filter((port) => port)
  const duplicatedPort = allPorts.find((port, index) => allPorts.indexOf(port) !== index)
  if (duplicatedPort) {
    throw new AbortError(`Found port ${duplicatedPort} for multiple webs.`, 'Please define a unique port for each web.')
  }
  await Promise.all(
    allPorts.map(async (port) => {
      const portAvailable = await checkPortAvailability(port!)
      if (!portAvailable) {
        throw new AbortError(`Hard-coded port ${port} is not available, please choose a different one.`)
      }
    }),
  )
}

function scopesMessage(scopes: string[]) {
  return {
    list: {
      items: scopes.length === 0 ? ['No scopes'] : scopes,
    },
  }
}

export default dev
