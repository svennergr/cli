import {InfoTable, InfoTableProps} from './Prompts/InfoTable.js'
import {InlineToken, LinkToken, TokenItem, TokenizedText} from './TokenizedText.js'
import {Button, ButtonProps} from './Button.js'
import {handleCtrlC} from '../../ui.js'
import {messageWithPunctuation} from '../utilities.js'
import {AbortSignal} from '../../../../public/node/abort.js'
import useAbortSignal from '../hooks/use-abort-signal.js'
import React, {ReactElement, useCallback, useState} from 'react'
import {Box, Text, useApp, useInput, useStdout} from 'ink'

interface Choice<T> {
  label: string
  value: T
  role: ButtonProps['role']
}

export interface ButtonSelectPromptProps<T> {
  message: TokenItem<Exclude<InlineToken, LinkToken>>
  choices: Choice<T>[]
  onSubmit: (value: T) => void
  infoTable?: InfoTableProps['table']
  defaultValue?: T
  submitWithShortcuts?: boolean
  abortSignal?: AbortSignal
}

// eslint-disable-next-line react/function-component-definition
function ButtonSelectPrompt<T>({
  message,
  choices,
  infoTable,
  onSubmit,
  defaultValue,
  abortSignal,
}: React.PropsWithChildren<ButtonSelectPromptProps<T>>): ReactElement | null {
  if (choices.length === 0) {
    throw new Error('ButtonSelectPrompt requires at least one choice')
  }
  const initialValue =
    typeof defaultValue === 'undefined' ? choices[0]! : choices.find((choice) => choice.value === defaultValue)!
  const [answer, setAnswer] = useState<Choice<T>>(initialValue)
  const {exit: unmountInk} = useApp()
  const [submitted, setSubmitted] = useState(false)
  const {stdout} = useStdout()

  const submitAnswer = useCallback(
    (answer: Choice<T>) => {
      setSubmitted(true)
      unmountInk()
      onSubmit(answer.value)
    },
    [stdout, unmountInk, onSubmit],
  )

  const {isAborted} = useAbortSignal(abortSignal)

  useInput((input, key) => {
    handleCtrlC(input, key)

    if (key.return) {
      submitAnswer(answer)
    }

    if (key.rightArrow || key.downArrow) {
      const currentIndex = choices.findIndex((c) => c.value === answer.value)
      const nextIndex = (currentIndex + 1) % choices.length
      setAnswer(choices[nextIndex]!)
    }

    if (key.leftArrow || key.upArrow) {
      const currentIndex = choices.findIndex((c) => c.value === answer.value)
      const nextIndex = (currentIndex - 1 + choices.length) % choices.length
      setAnswer(choices[nextIndex]!)
    }
  })

  return isAborted ? null : (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Box marginRight={2}>
          <Text>?</Text>
        </Box>
        <TokenizedText item={messageWithPunctuation(message)} />
      </Box>
      {infoTable && !submitted ? (
        <Box marginLeft={7} marginTop={1}>
          <InfoTable table={infoTable} />
        </Box>
      ) : null}
      {submitted ? <Text color="cyan">{` ${answer.label}`}</Text> : (
        <Box
          marginTop={1}
          justifyContent="center"
          width="100%"
          flexWrap="wrap"
          flexDirection="row"
        >
          {choices.map((choice, index) => (
            <Button
              key={index}
              label={choice.label}
              role={choice.role}
              active={choice.value === answer.value}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}

export {ButtonSelectPrompt}
