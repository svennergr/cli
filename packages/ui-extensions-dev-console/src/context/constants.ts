import {noop} from '../utilities/noop'
import {createContext} from 'react'

import type {RenderedExtensionContext} from './types'

export const DEFAULT_VALUE: RenderedExtensionContext = {
  extension: null,
  setRenderedExtension: noop,
}

export const renderedExtensionContext = createContext<RenderedExtensionContext>(DEFAULT_VALUE)
