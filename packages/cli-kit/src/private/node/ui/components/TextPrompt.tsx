import {TextInput} from './TextInput.js'
import {TokenizedText} from './TokenizedText.js'
import {handleCtrlC} from '../../ui.js'
import useLayout from '../hooks/use-layout.js'
import {messageWithPunctuation} from '../utilities.js'
import React, {FunctionComponent, useCallback, useState} from 'react'
import {Box, useApp, useInput, Text} from 'ink'
import figures from 'figures'

export interface TextPromptProps {
  message: string
  onSubmit: (value: string) => void
  defaultValue?: string
  password?: boolean
  validate?: (value: string) => string | undefined
  allowEmpty?: boolean
  prefix?: string
}

const TextPrompt: FunctionComponent<TextPromptProps> = ({
  message,
  onSubmit,
  validate,
  defaultValue = '',
  password = false,
  allowEmpty = false,
  prefix = '',
}) => {
  if (password && defaultValue) {
    throw new Error("Can't use defaultValue with password")
  }

  const validateAnswer = useCallback(
    (value: string): string | undefined => {
      if (validate) {
        return validate(value)
      }

      if (value.length === 0 && !allowEmpty) return 'Type an answer to the prompt.'

      return undefined
    },
    [allowEmpty, validate],
  )

  const {oneThird} = useLayout()
  const [answer, setAnswer] = useState<string>('')
  const answerOrDefault = answer.length > 0 ? answer : defaultValue
  const {exit: unmountInk} = useApp()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const shouldShowError = submitted && error
  const color = shouldShowError ? 'red' : 'cyan'
  const promptPrefix = `> ${prefix}`
  const resultPrefix = `${figures.tick} ${prefix}`
  const promptSize = prefix.length > 0 ? promptPrefix.length : 3
  const textboxMargin = prefix.length > 0 ? 0 : 2
  const underline = new Array(oneThird - promptSize).fill('▔')

  useInput((input, key) => {
    handleCtrlC(input, key)

    if (key.return) {
      setSubmitted(true)
      const error = validateAnswer(answerOrDefault)
      setError(error)

      if (!error) {
        onSubmit(answerOrDefault)
        unmountInk()
      }
    }
  })

  return (
    <Box flexDirection="column" marginBottom={1} width={oneThird}>
      <Box>
        <Box marginRight={2}>
          <Text>?</Text>
        </Box>
        <TokenizedText item={messageWithPunctuation(message)} />
      </Box>
      {submitted && !error ? (
        <Box>
          <Box marginRight={textboxMargin}>
            <Text color="cyan">{resultPrefix}</Text>
          </Box>

          <Box flexGrow={1}>
            <Text color="cyan">{password ? '*'.repeat(answer.length) : answerOrDefault}</Text>
          </Box>
        </Box>
      ) : (
        <Box flexDirection="column">
          <Box>
            <Box marginRight={textboxMargin}>
              <Text color={color}>{promptPrefix}</Text>
            </Box>
            <Box flexGrow={1}>
              <TextInput
                value={answer}
                onChange={(answer) => {
                  setAnswer(answer)
                  setSubmitted(false)
                }}
                defaultValue={defaultValue}
                color={color}
                password={password}
              />
            </Box>
          </Box>
          <Box marginLeft={promptSize}>
            <Text color={color}>{underline}</Text>
          </Box>
          {shouldShowError ? (
            <Box marginLeft={promptSize}>
              <Text color={color}>{error}</Text>
            </Box>
          ) : null}
        </Box>
      )}
    </Box>
  )
}

export {TextPrompt}
