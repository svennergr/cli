import React from 'react'
import { renderedExtensionContext } from './constants'

import type { RenderedExtensionrProviderProps } from './types'

export function RenderedExtensionrProvider({children, extension, setRenderedExtension}: RenderedExtensionrProviderProps) {
  return <renderedExtensionContext.Provider value={{extension, setRenderedExtension}}>{children}</renderedExtensionContext.Provider>
}
