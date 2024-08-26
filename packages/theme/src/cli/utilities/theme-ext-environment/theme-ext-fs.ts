import {readThemeFile} from '../theme-fs.js'
import {calculateChecksum} from '../asset-checksum.js'
import {glob} from '@shopify/cli-kit/node/fs'
import {joinPath, relativePath} from '@shopify/cli-kit/node/path'
import {AdminSession} from '@shopify/cli-kit/node/session'
import EventEmitter from 'node:events'
import {stat} from 'fs/promises'
import type {
  ThemeAsset,
  ThemeFileSystem,
  ThemeFSEventName,
  ThemeFSEventPayload,
} from '@shopify/cli-kit/node/themes/types'

const THEME_EXT_DEFAULT_IGNORE_PATTERNS = [
  '**/.git',
  '**/.vscode',
  '**/.hg',
  '**/.bzr',
  '**/.svn',
  '**/_darcs',
  '**/CVS',
  '**/*.sublime-(project|workspace)',
  '**/.DS_Store',
  '**/.sass-cache',
  '**/Thumbs.db',
  '**/desktop.ini',
  '**/config.yml',
  '**/node_modules/',
  '.prettierrc.json',
]

const THEME_EXT_DIRECTORY_PATTERNS = [
  'assets/**/*.*',
  'locales/**/*.json',
  'blocks/**/*.liquid',
  'snippets/**/*.liquid',
]

export function mountThemeExtensionFileSystem(root: string): ThemeFileSystem {
  const files = new Map<string, ThemeAsset>()
  const eventEmitter = new EventEmitter()

  const emitEvent = <T extends ThemeFSEventName>(eventName: T, payload: ThemeFSEventPayload<T>) => {
    eventEmitter.emit(eventName, payload)
  }

  const read = async (fileKey: string) => {
    const fileContent = await readThemeFile(root, fileKey)
    const checksum = calculateChecksum(fileKey, fileContent)

    files.set(fileKey, {
      key: fileKey,
      checksum,
      value: typeof fileContent === 'string' ? fileContent : '',
      attachment: Buffer.isBuffer(fileContent) ? fileContent.toString('base64') : '',
    })

    return fileContent
  }

  const initialFilesPromise = glob(THEME_EXT_DIRECTORY_PATTERNS, {
    cwd: root,
    deep: 3,
    ignore: THEME_EXT_DEFAULT_IGNORE_PATTERNS,
  }).then((filesPaths) => Promise.all(filesPaths.map(read)))

  const getKey = (filePath: string) => relativePath(root, filePath)
  const handleFileUpdate = (eventName: 'add' | 'change', filePath: string) => {
    const fileKey = getKey(filePath)

    const contentPromise = read(fileKey).then(() => {
      const file = files.get(fileKey)
      return file?.value ?? file?.attachment ?? ''
    })

    emitEvent(eventName, {
      fileKey,
      onContent: (fn) => {
        contentPromise.then(fn).catch(() => {})
      },
      onSync: (_fn) => {
        // syncPromise.then(fn).catch(() => {})
      },
    })
  }

  const handleFileDelete = (filePath: string) => {
    const fileKey = getKey(filePath)
    files.delete(fileKey)

    emitEvent('unlink', {
      fileKey,
      onSync: (_fn) => {
        // sleep(2)
        //   .then(fn)
        //   .catch(() => {})
      },
    })
  }

  const directoriesToWatch = new Set(
    THEME_EXT_DIRECTORY_PATTERNS.map((pattern) => joinPath(root, pattern.split('/').shift() ?? '')),
  )

  return {
    root,
    files,
    ready: () => initialFilesPromise.then(() => {}),
    delete: async (fileKey: string) => {
      files.delete(fileKey)
    },
    write: async (asset: ThemeAsset) => {
      files.set(asset.key, asset)
    },
    read,
    stat: async (fileKey: string) => {
      if (files.has(fileKey)) {
        const absolutePath = joinPath(root, fileKey)
        const stats = await stat(absolutePath)

        if (stats.isFile()) {
          const fileReducedStats = {size: stats.size, mtime: stats.mtime}
          return fileReducedStats
        }
      }
    },
    addEventListener: (eventName, cb) => {
      eventEmitter.on(eventName, cb)
    },
    startWatcher: async (_themeId?: string, _adminSession?: AdminSession) => {
      const {default: chokidar} = await import('chokidar')

      const watcher = chokidar.watch([...directoriesToWatch], {
        ignored: THEME_EXT_DEFAULT_IGNORE_PATTERNS,
        persistent: !process.env.SHOPIFY_UNIT_TEST,
        ignoreInitial: true,
      })

      watcher
        .on('add', handleFileUpdate.bind(null, 'add'))
        .on('change', handleFileUpdate.bind(null, 'change'))
        .on('unlink', handleFileDelete.bind(null))
    },
  }
}
