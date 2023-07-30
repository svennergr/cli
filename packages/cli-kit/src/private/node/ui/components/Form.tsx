import {TextAnimation} from './TextAnimation.js'
import {DemoStep} from '../demo.js'
import useLayout from '../hooks/use-layout.js'
// import useAsyncAndUnmount from '../hooks/use-async-and-unmount.js'
// import {isUnitTest} from '../../../../public/node/context/local.js'
// import {AbortSignal} from '../../../../public/node/abort.js'
// import useAbortSignal from '../hooks/use-abort-signal.js'
import {TextPrompt} from './TextPrompt.js'
import {AutocompletePrompt, AutocompletePromptProps} from './AutocompletePrompt.js'
import {SelectPrompt, SelectPromptProps} from './SelectPrompt.js'
import {Box, Text, useApp} from 'ink'
import {Banner} from '../components/Banner.js'
import React, {useEffect, useRef, useState} from 'react'

const loadingBarChar = '▀'

type ContextValue = string | boolean

export interface FormContext {
  [key: string]: ContextValue
}

export interface FormField<TContext extends FormContext = FormContext> {
  component: (ctx: TContext) => (DemoStep | Promise<DemoStep>)
  componentLoadingMessage?: string
  setProperty: string
}

export interface FormProps<TContext extends FormContext> {
  headline: string
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
  const currentField = fields[currentFieldIndex]!

  const [pastFields, setPastFields] = useState<{component: DemoStep, setProperty: string, result: boolean | string}[]>([])
  const [activeFieldComponent, setActiveFieldComponent] = useState<DemoStep | undefined>(undefined)
  let renderedActiveField: React.ReactElement | undefined
  const {exit: unmountInk} = useApp()
  if (activeFieldComponent) {
    renderedActiveField = renderField<TContext>({
      index: currentFieldIndex,
      ctx: ctx.current,
      setProperty: currentField.setProperty,
      field: activeFieldComponent!,
      nextField: () => {
        setPastFields([...pastFields, {
          component: activeFieldComponent!,
          setProperty: currentField.setProperty,
          result: ctx.current[currentField.setProperty]!,
        }])
        setActiveFieldComponent(undefined)
        if (currentFieldIndex === fields.length - 1) {
          onComplete(ctx.current)
          unmountInk()
        } else {
          setCurrentFieldIndex(currentFieldIndex + 1)
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
      setActiveFieldComponent(await currentField.component(ctx.current))
    }
    fieldInitiator()
  }, [currentFieldIndex])

  return (
    <Banner type="info" headline={headline}>
      <Box key="past" flexDirection="column">
        {renderedPastFields.map((field, index) => <Box key={`past-field-${index}`}>{field}</Box>)}
      </Box>
      <Box key="active" flexDirection="column">
        {renderedActiveField ?? <>
          <TextAnimation text={loadingBar} />
          <Text>{currentField.componentLoadingMessage ?? 'Loading'} ...</Text>
        </>}
      </Box>
    </Banner>
  )

  // <TextAnimation text={loadingBar} />

  // const runTasks = async () => {
    // for (const task of tasks) {
      // setCurrentTask(task)

      // // eslint-disable-next-line no-await-in-loop
      // const subTasks = await runTask(task, ctx.current)

      // // subtasks
      // if (Array.isArray(subTasks) && subTasks.length > 0 && subTasks.every((task) => 'task' in task)) {
        // for (const subTask of subTasks) {
          // setCurrentTask(subTask)
          // // eslint-disable-next-line no-await-in-loop
          // await runTask(subTask, ctx.current)
        // }
      // }
    // }
  // }

  // useAsyncAndUnmount(runTasks, {
    // onFulfilled: () => {
      // setState(TasksState.Success)
      // onComplete(ctx.current)
    // },
    // onRejected: () => {
      // setState(TasksState.Failure)
    // },
  // })

  // const {isAborted} = useAbortSignal(abortSignal)

  // if (silent) {
    // return null
  // }
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
      return <TextPrompt key={`field-${index}`} {...field.properties} onSubmit={(value: string) => onSubmit(value)} noUnmount submitted={result as string}/>
    case 'selectPrompt':
      return <SelectPrompt key={`field-${index}`} {...(field.properties as SelectPromptProps<TContext[keyof TContext]>)} onSubmit={onSubmit} noUnmount submitted={result} />
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
      return <SelectPrompt key={`field-${index}`} {...newProps} onSubmit={onSubmit} noUnmount />
    default:
      throw new Error(`Unknown step type: ${(field as DemoStep).type}`)
  }
}

export {Form}
