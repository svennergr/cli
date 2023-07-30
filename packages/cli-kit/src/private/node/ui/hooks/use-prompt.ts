import {useState} from 'react'

export enum PromptState {
  Idle = 'idle',
  Loading = 'loading',
  Submitted = 'submitted',
  Error = 'error',
  Cancelled = 'cancelled',
}

interface UsePromptProps<T> {
  initialAnswer: T
  submitted?: T
}

export default function usePrompt<T>({initialAnswer, submitted}: UsePromptProps<T>) {
  const [promptState, setPromptState] = useState<PromptState>(typeof submitted !== 'undefined' ? PromptState.Submitted : PromptState.Idle)
  const [answer, setAnswer] = useState<T>(submitted ?? initialAnswer)

  return {
    promptState,
    setPromptState,
    answer,
    setAnswer,
  }
}
