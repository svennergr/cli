import {Text, useApp} from 'ink'
import React, {useLayoutEffect, useState} from 'react'

const frames = ['-', '\\', '|', '/']

export const Spinner = () => {
  const [frame, setFrame] = useState(frames[0]!)
  const [finished, setFinished] = useState(false)
  const {exit} = useApp()

  useLayoutEffect(() => {
    const interval = setInterval(() => {
      setFrame((frame) => {
        const nextIndex = frames.indexOf(frame) + 1
        return frames[nextIndex % frames.length]!
      })
    }, 80)

    setTimeout(() => {
      setFinished(true)
      clearInterval(interval)
      exit()
    }, 2000)
  }, [])

  return <Text color="cyan">{finished ? 'done' : frame}</Text>
}
