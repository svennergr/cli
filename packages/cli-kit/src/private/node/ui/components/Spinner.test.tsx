import {Spinner} from './Spinner.js'
import {render} from '../../testing/ui.js'
import {describe, expect, test} from 'vitest'
import React from 'react'

describe('Spinner', async () => {
  test('shows "done" at the end', async () => {
    const {lastFrame, waitUntilExit} = render(<Spinner />)

    await waitUntilExit()

    expect(lastFrame()).toMatchInlineSnapshot('"[36mdone[39m"')
  })
})
