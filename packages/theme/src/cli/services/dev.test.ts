import {showDeprecationWarnings, REQUIRED_FOLDERS, validThemeDirectory, refreshTokens, dev} from './dev.js'
import {describe, expect, test, vi} from 'vitest'
import {mockAndCaptureOutput} from '@shopify/cli-kit/node/testing/output'
import {joinPath} from '@shopify/cli-kit/node/path'
import {inTemporaryDirectory, mkdir} from '@shopify/cli-kit/node/fs'
import {execCLI2} from '@shopify/cli-kit/node/ruby'

vi.mock('@shopify/cli-kit/node/ruby')

describe('dev', () => {
  test('runs theme serve on CLI2 without passing a token when no password is used', async () => {
    // When
    const adminSession = {storeFqdn: 'my-store.myshopify.com', token: 'my-token'}
    const options = {
      adminSession,
      storefrontToken: 'my-storefront-token',
      directory: 'my-directory',
      store: 'my-store',
      theme: '123',
      force: false,
      flagsToPass: [],
    }
    await dev(options)

    // Then
    const expectedParams = ['theme', 'serve', 'my-directory']
    expect(execCLI2).toHaveBeenCalledWith(expectedParams, {
      store: 'my-store',
      adminToken: undefined,
      storefrontToken: undefined,
    })
  })

  test('runs theme serve on CLI2 passing a token when a password is used', async () => {
    // When
    const adminSession = {storeFqdn: 'my-store.myshopify.com', token: 'my-token'}
    const options = {
      adminSession,
      storefrontToken: 'my-storefront-token',
      directory: 'my-directory',
      store: 'my-store',
      theme: '123',
      force: false,
      flagsToPass: [],
      password: 'my-token',
    }
    await dev(options)

    // Then
    const expectedParams = ['theme', 'serve', 'my-directory']
    expect(execCLI2).toHaveBeenCalledWith(expectedParams, {
      store: 'my-store',
      adminToken: 'my-token',
      storefrontToken: 'my-storefront-token',
    })
  })
})

describe('validThemeDirectory', () => {
  test('should not consider an empty directory to be a valid theme directory', async () => {
    await inTemporaryDirectory(async (tmpDir) => {
      await expect(validThemeDirectory(tmpDir)).resolves.toBe(false)
    })
  })

  test('should not consider an incomplete theme directory to be a valid theme directory', async () => {
    await inTemporaryDirectory(async (tmpDir) => {
      await mkdir(joinPath(tmpDir, REQUIRED_FOLDERS[0]!))
      await expect(validThemeDirectory(tmpDir)).resolves.toBe(false)
    })
  })

  test('should consider a theme directory to be a valid theme directory', async () => {
    await inTemporaryDirectory(async (tmpDir) => {
      await Promise.all(REQUIRED_FOLDERS.map((requiredFolder) => mkdir(joinPath(tmpDir, requiredFolder))))
      await expect(validThemeDirectory(tmpDir)).resolves.toBe(true)
    })
  })
})

describe('showDeprecationWarnings', () => {
  test('does nothing when the -e flag includes a value', async () => {
    // Given
    const outputMock = mockAndCaptureOutput()

    // When
    showDeprecationWarnings(['-e', 'whatever'])

    // Then
    expect(outputMock.output()).toMatch('')
  })

  test('shows a warning message when the -e flag does not include a value', async () => {
    // Given
    const outputMock = mockAndCaptureOutput()

    // When
    showDeprecationWarnings(['-e'])

    // Then
    expect(outputMock.output()).toMatch(/reserved for environments/)
  })

  test('shows a warning message when the -e flag is followed by another flag', async () => {
    // Given
    const outputMock = mockAndCaptureOutput()

    // When
    showDeprecationWarnings(['-e', '--verbose'])

    // Then
    expect(outputMock.output()).toMatch(/reserved for environments/)
  })
})

describe('refreshTokens', () => {
  test('returns the admin session and storefront token', async () => {
    // When
    const result = await refreshTokens('my-store', 'my-password')

    // Then
    expect(result).toEqual({
      adminSession: {storeFqdn: 'my-store.myshopify.com', token: 'my-password'},
      storefrontToken: 'my-password',
    })
  })

  test('refreshes CLI2 cache with theme token command', async () => {
    // When
    await refreshTokens('my-store', 'my-password')

    // Then
    const expectedParams = ['theme', 'token', '--admin', 'my-password', '--sfr', 'my-password']
    expect(execCLI2).toHaveBeenCalledWith(expectedParams)
  })
})
