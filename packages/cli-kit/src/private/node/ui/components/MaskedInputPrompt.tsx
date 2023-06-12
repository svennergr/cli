import {TextInput} from './TextInput.js'
import {TokenizedText} from './TokenizedText.js'
import {handleCtrlC} from '../../ui.js'
import useLayout from '../hooks/use-layout.js'
import {messageWithPunctuation} from '../utilities.js'
import {AbortSignal} from '../../../../public/node/abort.js'
import useAbortSignal from '../hooks/use-abort-signal.js'
import React, {FunctionComponent, useCallback, useState} from 'react'
import {Box, useApp, useInput, Text} from 'ink'
import figures from 'figures'

export interface MaskedInputPromptProps {
  message: string
  onSubmit: (value: string) => void
  defaultValue?: string
  password?: boolean
  validate?: (value: string) => string | undefined
  allowEmpty?: boolean
  emptyDisplayedValue?: string
  abortSignal?: AbortSignal
}

const MaskedInputPrompt: FunctionComponent<MaskedInputPromptProps> = ({
  message,
  onSubmit,
  validate,
  defaultValue = '',
  password = false,
  allowEmpty = false,
  emptyDisplayedValue = '(empty)',
  abortSignal,
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
  const displayEmptyValue = answerOrDefault === ''
  const displayedAnswer = displayEmptyValue ? emptyDisplayedValue : answerOrDefault
  const {exit: unmountInk} = useApp()
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const shouldShowError = submitted && error
  const color = shouldShowError ? 'red' : 'cyan'
  const underline = new Array(oneThird - 3).fill('▔')
  const {isAborted} = useAbortSignal(abortSignal)

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

  const formatAnswer = (text: string) => {
    return text.toLowerCase().replace(/ /g, "-")
  }

  return isAborted ? null : (
    <>
    <Box flexDirection="column" marginBottom={1} width={oneThird}>
      <Box>
        <Box marginRight={2}>
          <Text>?</Text>
        </Box>
        <TokenizedText item={messageWithPunctuation(message)} />
      </Box>
      {submitted && !error ? (
        <Box>
          <Box marginRight={2}>
            <Text color="cyan">{figures.tick}</Text>
          </Box>

          <Box flexGrow={1}>
            <Text color="cyan" dimColor={displayEmptyValue}>
              {password ? '*'.repeat(answer.length) : displayedAnswer}
            </Text>
          </Box>
        </Box>
      ) : (
        <Box flexDirection="column">
          <Box>
            <Box marginRight={2}>
              <Text color={color}>{`>`}</Text>
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
          <Box marginLeft={3}>
            <Text color={color}>{underline}</Text>
          </Box>
          {shouldShowError ? (
            <Box marginLeft={3}>
              <Text color={color}>{error}</Text>
            </Box>
          ) : null}
        </Box>
      )}
    </Box>
    <Box>
              <Text>shopify.app.</Text>
              <Text
                color={color}
              >
              {answer ? formatAnswer(answer) : formatAnswer(defaultValue)}
              </Text>
              <Text>.toml</Text>

        <Text>{submitted ? " created in your root directory\n" : " will be generated in your root directory\n"}</Text>
      </Box>
    </>
  )
}

export {MaskedInputPrompt}
