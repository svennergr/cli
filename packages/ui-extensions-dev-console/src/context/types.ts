import {ExtensionPayload} from '@shopify/ui-extensions-server-kit'
import {PropsWithChildren} from 'react'

export interface RenderedExtensionContext {
  extension: ExtensionPayload | null
  setRenderedExtension: (extension: ExtensionPayload) => void
}

export type RenderedExtensionrProviderProps = PropsWithChildren<{
  extension: ExtensionPayload | null
  setRenderedExtension: (extension: ExtensionPayload) => void
}>
