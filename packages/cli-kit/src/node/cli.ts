// CLI
import {initializeCliKitStore} from '../store.js'
import {initiateLogging} from '../output.js'
import {isDebug} from '../environment/local.js'
import constants, {bugsnagApiKey} from '../constants.js'
import {reportEvent} from '../analytics.js'
import {
  mapper as errorMapper,
  handler as errorHandler,
  AbortSilent,
  shouldReport as shouldReportError,
} from '../error.js'
import {findUpAndReadPackageJson} from '../dependency.js'
import {moduleDirectory} from '../path.js'
import {Errors, run, settings, flush} from '@oclif/core'
import Bugsnag from '@bugsnag/js'

interface RunCLIOptions {
  /** The value of import.meta.url of the CLI executable module */
  moduleURL: string
  /** The logs file name */
  logFilename: string
  /** The type of project we expect commands to be prefaced with **/
  projectType?: string
}

/**
 * A function that abstracts away setting up the environment and running
 * a CLI
 * @param module {RunCLIOptions} Options.
 */
export async function runCLI(options: RunCLIOptions) {
  await initializeCliKitStore()
  initiateLogging({filename: options.logFilename})
  if (isDebug()) {
    settings.debug = true
  } else {
    Bugsnag.start({
      apiKey: bugsnagApiKey,
      logger: null,
      appVersion: await constants.versions.cliKit(),
      autoTrackSessions: false,
    })
  }
  await _runCLI(options)
}

async function _runCLI(options: RunCLIOptions, {withPrefix}: {withPrefix?: boolean} = {}): Promise<void> {
  let runArgv = process.argv.slice(2)
  if (withPrefix && options.projectType) runArgv = [options.projectType, ...runArgv]
  try {
    await run(runArgv, options.moduleURL).then(flush)
  } catch (error) {
    await handleCliError(error as Error, options)
  }
}

async function handleCliError(error: Error, options: RunCLIOptions): Promise<void | Error> {
  const errorMessageMatch = error.message?.match(/^command (.*) not found$/)
  if (
    options.projectType &&
    error instanceof Errors.CLIError &&
    errorMessageMatch &&
    errorMessageMatch[1].split(':')[0] !== options.projectType
  ) {
    const result = await _runCLI(options, {withPrefix: true})
    return result
  } else if (error instanceof AbortSilent) {
    process.exit(1)
  } else {
    return errorMapper(error)
      .then(reportError)
      .then((error: Error) => {
        return errorHandler(error)
      })
      .then(() => {
        process.exit(1)
      })
  }
}

/**
 * A function for create-x CLIs that automatically runs the "init" command.
 * @param options
 */
export async function runCreateCLI(options: RunCLIOptions) {
  const packageJson = await findUpAndReadPackageJson(moduleDirectory(options.moduleURL))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const packageName = (packageJson.content as any).name as string
  const name = packageName.replace('@shopify/create-', '')
  const initIndex = process.argv.findIndex((arg) => arg.includes('init'))
  if (initIndex === -1) {
    const initIndex =
      process.argv.findIndex((arg) => arg.match(new RegExp(`bin(\\/|\\\\)+(create-${name}|dev|run)`))) + 1
    process.argv.splice(initIndex, 0, 'init')
  }
  await runCLI(options)
}

const reportError = async (errorToReport: Error): Promise<Error> => {
  await reportEvent({errorMessage: errorToReport.message})
  if (settings.debug || !shouldReportError(errorToReport)) return errorToReport

  let mappedError: Error

  // eslint-disable-next-line no-prototype-builtins
  if (Error.prototype.isPrototypeOf(errorToReport)) {
    mappedError = new Error(errorToReport.message)
    if (errorToReport.stack) {
      // For mac/linux, remove `file:///` from stacktrace
      // For windows, remove `file:///C:/` from stacktrace
      const regex = '\\((.*node_modules.)(@shopify.)?'
      mappedError.stack = errorToReport.stack.replace(new RegExp(regex, 'g'), '(')
    }
  } else if (typeof errorToReport === 'string') {
    mappedError = new Error(errorToReport)
  } else {
    mappedError = new Error('Unknown error')
  }

  await new Promise((resolve, reject) => {
    Bugsnag.notify(mappedError, undefined, resolve)
  })
  return mappedError
}

export default runCLI
