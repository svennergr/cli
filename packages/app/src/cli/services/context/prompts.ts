import {LocalSource, RemoteSource} from './identifiers.js'
import {LocalRemoteSource} from './id-matching.js'
import {
  InfoTableSection,
  renderAutocompletePrompt,
  renderConfirmationPrompt,
  renderInfo,
} from '@shopify/cli-kit/node/ui'

export async function matchConfirmationPrompt(
  local: LocalSource,
  remote: RemoteSource,
  type: 'extension' | 'function' = 'extension',
) {
  return renderConfirmationPrompt({
    message: `Match ${local.handle} (local name) with ${remote.title} (name on Shopify Partners, ID: ${remote.id})?`,
    confirmationMessage: `Yes, match to existing ${type}`,
    cancellationMessage: `No, create as a new ${type}`,
  })
}

export async function selectRemoteSourcePrompt(
  localSource: LocalSource,
  remoteSourcesOfSameType: RemoteSource[],
  remoteIdField: 'id' | 'uuid',
): Promise<RemoteSource> {
  const remoteOptions = remoteSourcesOfSameType.map((remote) => ({
    label: `Match it to ${remote.title} (ID: ${remote.id} on Shopify Partners)`,
    value: remote[remoteIdField],
  }))
  remoteOptions.push({label: 'Create new extension', value: 'create'})
  const uuid = await renderAutocompletePrompt({
    message: `How would you like to deploy your "${localSource.handle}"?`,
    choices: remoteOptions,
  })
  return remoteSourcesOfSameType.find((remote) => remote[remoteIdField] === uuid)!
}

export interface SourceSummary {
  appTitle: string | undefined
  extensionsContentPrompt: {
    extensionsInfoTable?: InfoTableSection
    deletedInfoTable?: InfoTableSection
  }
  configContentPrompt: {
    configInfoTable: InfoTableSection
    deletedInfoTable?: InfoTableSection
  }
  release: boolean
}

export async function extensionMigrationPrompt(
  toMigrate: LocalRemoteSource[],
  includeRemoteType = true,
): Promise<boolean> {
  const migrationNames = toMigrate.map(({local}) => `"${local.handle}"`).join(', ')
  const allMigrationTypes = toMigrate.map(({remote}) => remote.type.toLocaleLowerCase())
  const uniqueMigrationTypes = allMigrationTypes
    .filter((type, i) => allMigrationTypes.indexOf(type) === i)
    .map((name) => `"${name}"`)
    .join(', ')

  renderInfo({
    headline: "Extension migrations can't be undone.",
    body: `Your ${migrationNames} configuration has been updated. Migrating gives you access to new features and won't impact the end user experience. All previous extension versions will reflect this change.`,
  })

  const confirmMessage = includeRemoteType
    ? `Yes, confirm migration from ${uniqueMigrationTypes}`
    : 'Yes, confirm migration'

  return renderConfirmationPrompt({
    message: `Migrate ${migrationNames}?`,
    confirmationMessage: confirmMessage,
    cancellationMessage: 'No, cancel',
  })
}
