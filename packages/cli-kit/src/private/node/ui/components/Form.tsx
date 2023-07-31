import {TextAnimation} from './TextAnimation.js'
import {DemoStep} from '../demo.js'
import useLayout from '../hooks/use-layout.js'
import {InlineToken, LinkToken, TokenItem, TokenizedText} from './TokenizedText.js'
// import useAsyncAndUnmount from '../hooks/use-async-and-unmount.js'
// import {isUnitTest} from '../../../../public/node/context/local.js'
// import {AbortSignal} from '../../../../public/node/abort.js'
// import useAbortSignal from '../hooks/use-abort-signal.js'
import {TextPrompt} from './TextPrompt.js'
import {AutocompletePrompt, AutocompletePromptProps} from './AutocompletePrompt.js'
import {SelectPrompt, SelectPromptProps} from './SelectPrompt.js'
import {Box, Text, useApp, useInput} from 'ink'
import {Banner} from '../components/Banner.js'
import React, {useEffect, useRef, useState} from 'react'

const loadingBarChar = '▀'
const progressBarChar = '█'
const progressBarNegativeChar = '░'

type ContextValue = string | boolean

export interface FormContext {
  [key: string]: ContextValue
}

export interface FormField<TContext extends FormContext = FormContext> {
  component: (ctx: TContext) => (DemoStep | Promise<DemoStep>)
  componentLoadingMessage?: string
  setProperty: string
  label: string
}

export type Headline = TokenItem<Exclude<InlineToken, LinkToken>>

export interface FormProps<TContext extends FormContext> {
  headline: Headline
  fields: FormField<TContext>[]
  onComplete: (ctx: TContext) => void
}

// eslint-disable-next-line react/function-component-definition
function Form<TContext extends FormContext>({
  headline,
  fields,
  onComplete,
}: React.PropsWithChildren<FormProps<TContext>>) {
  const ctx = useRef<TContext>({} as TContext)
  const {twoThirds} = useLayout()
  const loadingBarWidth = twoThirds - 6 // 6 = 2x padding
  const loadingBar = new Array(loadingBarWidth).fill(loadingBarChar).join('')

  const [currentFieldIndex, setCurrentFieldIndex] = useState(0)
  const currentField = fields[currentFieldIndex]
  const loadingField = useRef(false)
  const [complete, setComplete] = useState(false)

  const [pastFields, setPastFields] = useState<{component: DemoStep, setProperty: string, result: boolean | string}[]>([])
  const [activeFieldComponent, setActiveFieldComponent] = useState<DemoStep | undefined>(undefined)
  let renderedActiveField: React.ReactElement | undefined
  const {exit: unmountInk} = useApp()
  if (activeFieldComponent) {
    renderedActiveField = renderField<TContext>({
      index: currentFieldIndex,
      ctx: ctx.current,
      setProperty: currentField!.setProperty,
      field: activeFieldComponent!,
      nextField: () => {
        setPastFields([...pastFields, {
          component: activeFieldComponent!,
          setProperty: currentField!.setProperty,
          result: ctx.current[currentField!.setProperty]!,
        }])
        setActiveFieldComponent(undefined)
        setCurrentFieldIndex(currentFieldIndex + 1)
        if (currentFieldIndex === fields.length - 1) {
          setComplete(true)
          setTimeout(() => {
            unmountInk()
            onComplete(ctx.current)
          }, 0)
        }
      },
    })
  }
  const renderedPastFields = pastFields.map(({component, setProperty, result}, index) => {
    return renderField<TContext>({
      index,
      ctx: ctx.current,
      setProperty,
      field: component,
      nextField: () => {},
      result,
    })
  })

  useEffect(() => {
    const fieldInitiator = async () => {
      if (!currentField) return
      loadingField.current = true
      const newComponent = await currentField.component(ctx.current)
      if (loadingField.current) {
        loadingField.current = false
        setActiveFieldComponent(newComponent)
      }
    }
    fieldInitiator()
  }, [currentFieldIndex])

  useInput((_input, key) => {
    if (key.tab && key.shift) {
      if (currentFieldIndex === 0) {
        return
      }
      loadingField.current = false
      setActiveFieldComponent(undefined)
      setPastFields(pastFields.slice(0, pastFields.length - 1))
      setCurrentFieldIndex(currentFieldIndex - 1)
    }
  })

  const fractionComplete = currentFieldIndex / fields.length
  const progressBarWidth = 20
  const progressBar = new Array(progressBarWidth).fill(progressBarNegativeChar).fill(progressBarChar, 0, Math.floor(progressBarWidth * fractionComplete)).join('')

  return (
    <Box
      width={twoThirds}
      marginBottom={1}
      borderStyle="round"
      borderLeft={true}
      borderTop={false}
      borderRight={false}
      borderBottom={false}
      paddingLeft={1}
      gap={1}
      flexDirection="column"
    >
      <TokenizedText item={headline} />
      {undefined && <Box key="labels" flexDirection="row">
        {fields.map((field, index) => {
          const isActive = index === currentFieldIndex
          const isPast = index < currentFieldIndex
          return <Box
            key={`label-badge-${index}-${Math.random()}`}
            borderStyle={isActive ? 'bold' : 'single'}
            borderDimColor={isPast}
            borderTop={false}
            borderLeft={false}
            borderRight={false}
            borderBottom={true}
            paddingX={1}
          >
            <Text bold={isActive} dimColor={isPast}>{field.label}</Text>
          </Box>
        })}
      </Box>}
      {renderedPastFields.length > 0 ? (
        <Box key="past" flexDirection="column">
          {renderedPastFields.map((field, index) => <Box key={`past-field-${index}`}>{field}</Box>)}
        </Box>
      ) : null}
      {complete ? null : <Box key="active" flexDirection="column">
        {renderedActiveField ?? <>
          <TextAnimation text={loadingBar} />
          <Text>{currentField?.componentLoadingMessage ?? 'Loading'} ...</Text>
        </>}
      </Box>}
      <Box key="progress" flexDirection="column">
        <Box key="progress-indicator" flexDirection="row" gap={2}>
          <Text bold>{pastFields.length}/{fields.length} questions answered</Text>
          <Text>{progressBar}</Text>
        </Box>
        {pastFields.length > 0 ? (
          <Box key="instructions" flexDirection="row">
            <Text dimColor>
              <Text bold>Shift+Tab</Text> to return to the previous question
            </Text>
          </Box>
        ) : null}
      </Box>
    </Box>
  )
}

interface RenderFieldOptions<TContext extends FormContext> {
  index: number
  ctx: TContext
  field: DemoStep
  setProperty: keyof TContext
  nextField: () => void
  result?: ContextValue
}

function renderField<TContext extends FormContext>({index, ctx, field, setProperty, nextField, result}: RenderFieldOptions<TContext>): React.ReactElement {
  const onSubmit = (value: ContextValue) => {
    (ctx as any)[setProperty] = value
    nextField()
  }

  switch(field.type) {
    case 'textPrompt':
      return <TextPrompt key={`field-${index}`} {...field.properties} onSubmit={(value: string) => onSubmit(value)} noUnmount submitted={result as string} dimOnSubmitted />
    case 'selectPrompt':
      return <SelectPrompt key={`field-${index}`} {...(field.properties as SelectPromptProps<TContext[keyof TContext]>)} onSubmit={onSubmit} noUnmount submitted={result} dimOnSubmitted />
    case 'autocompletePrompt':
      const autocompleteProps = {
        search(term: string) {
          const lowerTerm = term.toLowerCase()
          return Promise.resolve({
            data: field.properties.choices.filter((item) => {
              return (
                item.label.toLowerCase().includes(lowerTerm) // || (item.group && item.group.toLowerCase().includes(lowerTerm))
              )
            }),
          })
        },
        ...field.properties,
        onSubmit,
        submitted: result as string,
        dimOnSubmitted: true,
      }
      return <AutocompletePrompt key={index} {...(autocompleteProps as AutocompletePromptProps<string>)} noUnmount />
    case 'confirmationPrompt':
      const choices = [
        {
          label: field.properties.confirmationMessage ?? 'Yes, confirm',
          value: true,
          key: 'y',
        },
        {
          label: field.properties.cancellationMessage ?? 'No, cancel',
          value: false,
          key: 'n',
        },
      ]
      const newProps = {...field.properties, choices} as Omit<SelectPromptProps<string | boolean>, 'onSubmit'>
      return <SelectPrompt key={`field-${index}`} {...newProps} onSubmit={onSubmit} submitted={result} noUnmount dimOnSubmitted />
    default:
      throw new Error(`Unknown step type: ${(field as DemoStep).type}`)
  }
}

export {Form}
